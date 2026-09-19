import { application, applicationInterests } from "@/db/schema";
import { Application, db } from "./db";

import { and, eq } from "drizzle-orm";
import { addApplicationComment } from "./comment";
import { getFilenameUrl } from "./file-upload";
import { notification } from "@/db/schema/notification";
import { getActiveRecruitment } from "./recruitment";

export async function getApplication(
  id: string,
  recruitmentId?: number,
): Promise<Application | null> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return null;

  const whereClause = and(
    eq(application.candidateId, id),
    eq(application.recruitmentId, targetId),
  );

  const app = await db.query.application.findFirst({
    where: whereClause,
  });

  if (!app) return null;

  return {
    ...app,
    curriculum: await getFilenameUrl(app?.curriculum),
  };
}

export async function hasApplication(
  userId: string | undefined,
  recruitmentId?: number,
) {
  if (!userId) return false;

  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  const whereClause = targetId
    ? and(
        eq(application.candidateId, userId),
        eq(application.recruitmentId, targetId),
      )
    : eq(application.candidateId, userId);

  const app = await db.select().from(application).where(whereClause);

  return app.length > 0;
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
  recruitmentId?: number,
): Promise<boolean> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  const whereClause = targetId
    ? and(
        eq(application.candidateId, candidateId),
        eq(application.recruitmentId, targetId),
      )
    : eq(application.candidateId, candidateId);

  const app = await db.select().from(application).where(whereClause);

  if (app.length === 0) return false;

  try {
    return await db.transaction(async (tx) => {
      const mentions = [];
      for (const c of content) {
        mentions.push(...c.content.filter((c) => c.type === "mention"));
      }

      const id = await addApplicationComment(app[0].id, content, authorId);

      const uniqueMentions = Array.from(
        new Map(mentions.map((m) => [m.userId, m])).values(),
      );

      for (const mention of uniqueMentions) {
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
