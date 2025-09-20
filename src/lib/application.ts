import { application, applicationInterests } from "@/db/schema";
import { Application, db } from "./db";

import { eq } from "drizzle-orm";

export async function getApplication(id: string): Promise<Application | null> {
  const app = await db
    .select()
    .from(application)
    .where(eq(application.candidateId, id));

  if (app.length === 0) return null;

  return app[0];
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
