import { application, applicationComment, user } from "@/db/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";
import { getFilenameUrl } from "./file-upload";
import { Comment } from "@/components/candidate/page/candidate-comments";

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

export async function getApplicationComments(
  candidateId: string,
): Promise<Array<Comment>> {
  const app = await db
    .select()
    .from(application)
    .where(eq(application.candidateId, candidateId));

  if (app.length === 0) return [];

  const results = await db
    .select()
    .from(applicationComment)
    .where(eq(applicationComment.applicationId, app[0].id))
    .fullJoin(user, eq(applicationComment.authorId, user.id))
    .orderBy(desc(applicationComment.createdAt), desc(applicationComment.id));

  return await Promise.all(
    results.map(
      async (e): Promise<Comment> => ({
        user: {
          ...e.user,
          image: await getFilenameUrl(e.user.image),
        },
        comment: {
          ...e.application_comment,
        },
        type: "application",
      }),
    ),
  );
}
