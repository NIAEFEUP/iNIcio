import { application, applicationInterests } from "@/db/schema";
import { Application, db, Recruitment } from "./db";
import { and, desc, eq } from "drizzle-orm";
import { addApplicationComment } from "./comment";
import { getFilenameUrl } from "./file-upload";
import { notification } from "@/db/schema/notification";
import { getActiveRecruitment } from "./recruitment";
import type { CandidateRecruitmentResult } from "./final-messages";

export type UserApplicationWithRecruitment = Application & {
  recruitment: Recruitment | null;
};

export type UserApplicationWithDetails = UserApplicationWithRecruitment & {
  interests: string[];
  result?: CandidateRecruitmentResult | null;
};

export async function getApplication(
  id: string,
  recruitmentId?: number,
): Promise<Application | null> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  if (targetId) {
    const whereClause = and(
      eq(application.candidateId, id),
      eq(application.recruitmentId, targetId),
    );

    const app = await db.query.application.findFirst({
      where: whereClause,
    });

    if (app) {
      return {
        ...app,
        curriculum: await getFilenameUrl(app?.curriculum),
      };
    }
  }

  // Fallback: if no recruitmentId was specified and no application exists for the active recruitment,
  // return the latest submitted application for this candidate
  if (!recruitmentId) {
    const latestApp = await db.query.application.findFirst({
      where: eq(application.candidateId, id),
      orderBy: [desc(application.submittedAt)],
    });

    if (latestApp) {
      return {
        ...latestApp,
        curriculum: await getFilenameUrl(latestApp?.curriculum),
      };
    }
  }

  return null;
}

export async function getUserApplications(
  userId: string,
): Promise<UserApplicationWithRecruitment[]> {
  if (!userId) return [];

  const apps = await db.query.application.findMany({
    where: eq(application.candidateId, userId),
    with: {
      recruitment: true,
    },
    orderBy: [desc(application.submittedAt)],
  });

  return apps as UserApplicationWithRecruitment[];
}

export async function hasAnyApplication(
  userId: string | undefined,
): Promise<boolean> {
  if (!userId) return false;

  const app = await db
    .select({ id: application.id })
    .from(application)
    .where(eq(application.candidateId, userId))
    .limit(1);

  return app.length > 0;
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
): Promise<number | null> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  const whereClause = targetId
    ? and(
        eq(application.candidateId, candidateId),
        eq(application.recruitmentId, targetId),
      )
    : eq(application.candidateId, candidateId);

  const app = await db.select().from(application).where(whereClause);

  if (app.length === 0) return null;

  try {
    return await db.transaction(async (tx) => {
      const mentions = [];
      for (const c of content) {
        mentions.push(...c.content.filter((c: any) => c.type === "mention"));
      }

      const id = await addApplicationComment(app[0].id, content, authorId);

      const uniqueMentions = Array.from(
        new Map(mentions.map((m: any) => [m.userId, m])).values(),
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

      return id[0]?.id ?? null;
    });
  } catch (e) {
    console.error(e);
    return null;
  }
}
