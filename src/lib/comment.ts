import {
  application,
  applicationComment,
  dynamicComment,
  user,
} from "@/db/schema";
import { db } from "./db";
import { and, desc, eq } from "drizzle-orm";
import { getFilenameUrl } from "./file-upload";
import { Comment } from "@/components/candidate/page/candidate-comments";
import { getActiveRecruitment } from "./recruitment";

export async function addApplicationComment(
  applicationId: number,
  content: Array<any>,
  authorId: string,
) {
  const id = await db
    .insert(applicationComment)
    .values({
      applicationId,
      content,
      authorId,
    })
    .returning({ id: applicationComment.id });

  return id;
}

export async function updateApplicationComment(
  commentId: number,
  content: Array<any>,
  authorId: string,
  candidateId: string,
  recruitmentId: number,
): Promise<boolean> {
  const app = await db
    .select({ id: application.id })
    .from(application)
    .where(
      and(
        eq(application.candidateId, candidateId),
        eq(application.recruitmentId, recruitmentId),
      ),
    );

  if (app.length === 0) return false;

  const updated = await db
    .update(applicationComment)
    .set({ content, editedAt: new Date() })
    .where(
      and(
        eq(applicationComment.id, commentId),
        eq(applicationComment.authorId, authorId),
        eq(applicationComment.applicationId, app[0].id),
      ),
    )
    .returning({ id: applicationComment.id });

  return updated.length > 0;
}

export async function getApplicationComments(
  candidateId: string,
  recruitmentId?: number,
): Promise<Array<Comment>> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  const whereClause = and(
    eq(application.candidateId, candidateId),
    eq(application.recruitmentId, targetId),
  );

  const app = await db.select().from(application).where(whereClause);

  if (app.length === 0) return [];

  const results = await db
    .select()
    .from(applicationComment)
    .where(eq(applicationComment.applicationId, app[0].id))
    .fullJoin(user, eq(applicationComment.authorId, user.id))
    .orderBy(desc(applicationComment.createdAt), desc(applicationComment.id));

  return await Promise.all(
    results.map(async (e): Promise<Comment> => ({
      user: {
        ...e.user,
        image: await getFilenameUrl(e.user.image),
      },
      comment: {
        ...e.application_comment,
      },
      type: "application",
    })),
  );
}

export async function getDynamicComments(dynamicId: number) {
  const results = await db.query.dynamicComment.findMany({
    where: eq(dynamicComment.dynamicId, dynamicId),
    with: {
      author: {
        with: {
          user: true,
        },
      },
    },
  });

  return await Promise.all(
    results.map(async (e): Promise<Comment> => ({
      user: {
        ...e.author.user,
        image: await getFilenameUrl(e.author.user.image),
      },
      comment: {
        id: e.id,
        content: e.content,
        createdAt: e.createdAt,
        editedAt: e.editedAt,
        dynamicId: e.dynamicId,
        authorId: e.authorId,
      },
      type: "dynamic",
    })),
  );
}
