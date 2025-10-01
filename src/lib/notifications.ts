import "server-only";

import { applicationComment, notification } from "@/db/schema";
import { db } from "./db";
import { desc, eq, and } from "drizzle-orm";

type ApplicationCommentData = { commentType: string; commentId: number };

export async function getNotifications(userId: string) {
  const notifs = await db.query.notification.findMany({
    where: and(eq(notification.userId, userId), eq(notification.isRead, false)),
    orderBy: desc(notification.createdAt),
  });

  const results = await Promise.all(
    notifs.map(async (n) => {
      if (
        n.type === "mention" &&
        (n.data as ApplicationCommentData)?.commentType === "application"
      ) {
        const commentId = (
          (n.data as ApplicationCommentData).commentId[0] as any
        ).id;

        const [c] = await db.query.applicationComment.findMany({
          where: eq(applicationComment.id, commentId),
          with: {
            application: {
              with: {
                candidate: true,
              },
            },
            author: true,
          },
        });

        return { ...n, comment: c ?? null };
      }

      return { ...n, comment: null };
    }),
  );

  return results;
}
