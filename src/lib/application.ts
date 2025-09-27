import { application, applicationInterests } from "@/db/schema";
import { Application, db } from "./db";

import { eq } from "drizzle-orm";
import { addApplicationComment } from "./comment";
import { getFilenameUrl } from "./file-upload";

export async function getApplication(id: string): Promise<Application | null> {
  const app = await db.query.application.findFirst({
    where: eq(application.candidateId, id),
  });

  if (!app) return null;

  return {
    ...app,
    profilePicture: await getFilenameUrl(app?.profilePicture),
    curriculum: await getFilenameUrl(app?.curriculum),
  };
}

export async function getAllPossibleApplicationInterests(): Promise<string[]> {
  const interests = await db
    .selectDistinct({ interest: applicationInterests.interest })
    .from(applicationInterests);

  return interests.map((i) => i.interest);
}

export async function getApplicationInterests(
  application: Application | null | undefined,
): Promise<string[]> {
  if (!application) return [];

  const interests = await db
    .select()
    .from(applicationInterests)
    .where(eq(applicationInterests.applicationId, application.id));

  return interests.map((i) => i.interest);
}

export async function submitApplicationComment(
  candidateId: string,
  content: string,
): Promise<boolean> {
  const app = await db
    .select()
    .from(application)
    .where(eq(application.candidateId, candidateId));

  if (app.length === 0) return false;

  try {
    await addApplicationComment(app[0].id, content, candidateId);

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
