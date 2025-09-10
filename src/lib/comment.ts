import { application, applicationComment } from "@/db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function addApplicationComment(
  applicationId: string,
  content: string,
  authorId: string,
) {
  await db.insert(applicationComment).values({
    applicationId,
    content,
    authorId,
  });
}

export async function getApplicationComments(candidateId: string) {
  const app = await db
    .select()
    .from(application)
    .where(eq(application.candidateId, candidateId));

  if (app.length === 0) return [];

  return await db
    .select()
    .from(applicationComment)
    .where(eq(applicationComment.applicationId, app[0].id));
}
