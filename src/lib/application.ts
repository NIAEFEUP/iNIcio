import { application, applicationInterests } from "@/db/schema";
import { Application, db } from "./db";

import { eq } from "drizzle-orm";
import { addApplicationComment } from "./comment";
import { getFilenameUrl } from "./file-upload";
import { notification } from "@/db/schema/notification";

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
  content: Array<any>,
  authorId: string,
): Promise<boolean> {
  const app = await db
    .select()
    .from(application)
    .where(eq(application.candidateId, candidateId));

  if (app.length === 0) return false;

  try {
    return await db.transaction(async (tx) => {
      const mentions = [];
      for (const c of content) {
        mentions.push(...c.content.filter((c) => c.type === "mention"));
      }

      const id = await addApplicationComment(app[0].id, content, authorId);

      // filter repeated mentions (with props { userId: string, userName: string})
      const uniqueMentions = Array.from(
        new Map(mentions.map((m) => [m.userId, m])).values(),
      );

      for (const mention of uniqueMentions) {
        console.log("MENTION: ", mention);
        await tx.insert(notification).values({
          userId: mention.props.userId,
          type: "mention",
          data: {
            commentType: "application",
            commentId: id,
          },
          isRead: false,
        });
      }

      return true;
    });
  } catch (e) {
    console.error(e);
    return false;
  }
}
