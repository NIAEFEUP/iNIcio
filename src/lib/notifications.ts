import "server-only";

import { applicationComment, notification } from "@/db/schema";
import { db } from "./db";
import { desc, eq, and, inArray } from "drizzle-orm";

type ApplicationCommentData = { commentType: string; commentId: number };

/**
 * `data.commentId` was historically stored as an array of one object; accept
 * both shapes so old and new rows resolve to the same id.
 */
function getMentionedCommentId(data: unknown): number | null {
  const value = (data as ApplicationCommentData)?.commentId;
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    return (value[0] as { id?: number })?.id ?? null;
  }
  return typeof value === "number" ? value : null;
}

export async function getNotifications(userId: string) {
  const notifs = await db.query.notification.findMany({
    where: and(eq(notification.userId, userId), eq(notification.isRead, false)),
    orderBy: desc(notification.createdAt),
  });

  // Collect every mentioned comment id, then resolve them all in one query
  // instead of one query per notification.
  const commentIds = [
    ...new Set(
      notifs
        .map((n) =>
          n.type === "mention" &&
          (n.data as ApplicationCommentData)?.commentType === "application"
            ? getMentionedCommentId(n.data)
            : null,
        )
        .filter((id): id is number => id !== null),
    ),
  ];

  const commentsById = new Map<number, unknown>();
  if (commentIds.length > 0) {
    const comments = await db.query.applicationComment.findMany({
      where: inArray(applicationComment.id, commentIds),
      with: {
        application: {
          with: {
            candidate: {
              with: {
                user: true,
              },
            },
          },
        },
        author: true,
      },
    });

    for (const comment of comments) {
      commentsById.set(comment.id, comment);
    }
  }

  return notifs.map((n) => {
    if (
      n.type !== "mention" ||
      (n.data as ApplicationCommentData)?.commentType !== "application"
    ) {
      return { ...n, comment: null };
    }

    const commentId = getMentionedCommentId(n.data);
    return { ...n, comment: commentsById.get(commentId ?? -1) ?? null };
  });
}
