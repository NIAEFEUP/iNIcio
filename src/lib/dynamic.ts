import {
  candidateToDynamic,
  dynamic,
  dynamicComment,
  dynamicTemplate,
  slot,
  recruiterToDynamic,
} from "@/db/schema";
import { db, DynamicTemplate, Slot } from "./db";
import { and, eq, gt } from "drizzle-orm";
import { getFilenameUrl } from "./file-upload";
import { application } from "@/db/schema";
import {
  CandidateFilterRestriction,
  candidateFilterRestrictions,
  CandidateWithMetadata,
} from "./candidate";
import { getLatestVotingDecisionsForCandidates } from "./voting";
import { getActiveRecruitment } from "./recruitment";
import { getPreviousApplicationYears } from "./previous-applications";

export async function tryToAddCandidateToDynamic(
  candidateId: string,
  slotParam: Slot,
  recruitmentId?: number,
) {
  const targetRecruitmentId =
    recruitmentId ?? (await getActiveRecruitment())?.id;

  if (!targetRecruitmentId) {
    throw new Error("No recruitment specified or active");
  }

  await db.transaction(async (trx) => {
    const candidateDynamic = await db.query.candidateToDynamic.findFirst({
      where: and(
        eq(candidateToDynamic.candidateId, candidateId),
        eq(candidateToDynamic.recruitmentId, targetRecruitmentId),
      ),
      with: {
        dynamic: {
          with: {
            slot: true,
          },
        },
      },
    });

    if (candidateDynamic) {
      await trx
        .update(slot)
        .set({ quantity: candidateDynamic.dynamic.slot.quantity + 1 })
        .where(eq(slot.id, candidateDynamic.dynamic.slot.id));

      await trx
        .delete(candidateToDynamic)
        .where(
          and(
            eq(candidateToDynamic.candidateId, candidateId),
            eq(candidateToDynamic.recruitmentId, targetRecruitmentId),
          ),
        );
    }

    const s = await trx
      .select()
      .from(slot)
      .where(
        and(
          eq(slot.id, slotParam.id),
          eq(slot.recruitmentId, targetRecruitmentId),
          eq(slot.type, "dynamic"),
          gt(slot.quantity, 0),
        ),
      )
      .for("update");

    if (s.length === 0) {
      throw new Error("Slot not found or full");
    }

    await trx
      .update(slot)
      .set({ quantity: s[0].quantity - 1 })
      .where(eq(slot.id, slotParam.id));

    const possibleDynamic = await trx
      .select()
      .from(dynamic)
      .where(eq(dynamic.slot, slotParam.id))
      .for("update");

    if (possibleDynamic.length === 0) {
      const dynamicTemplate = await trx.query.dynamicTemplate.findFirst();

      const [insertedDynamic] = await trx
        .insert(dynamic)
        .values({
          slot: slotParam.id,
          recruitmentId: targetRecruitmentId,
          content: dynamicTemplate ? dynamicTemplate.content : [],
        })
        .returning({ id: dynamic.id });

      await trx.insert(candidateToDynamic).values({
        candidateId: candidateId,
        dynamicId: insertedDynamic.id,
        recruitmentId: targetRecruitmentId,
      });
    } else {
      await trx.insert(candidateToDynamic).values({
        candidateId: candidateId,
        dynamicId: possibleDynamic[0].id,
        recruitmentId: targetRecruitmentId,
      });
    }
  });
}

export async function getDynamic(dynamicId: number, recruitmentId?: number) {
  const where =
    recruitmentId !== undefined
      ? and(eq(dynamic.id, dynamicId), eq(dynamic.recruitmentId, recruitmentId))
      : eq(dynamic.id, dynamicId);

  const res = await db.query.dynamic.findFirst({
    where,
    with: {
      candidates: {
        with: {
          candidate: {
            with: {
              user: true,
              knownRecruiters: true,
              dynamic: {
                with: {
                  dynamic: {
                    with: {
                      slot: true,
                    },
                  },
                },
              },
              interview: {
                with: {
                  slot: true,
                },
              },
              application: {
                with: {
                  interests: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!res) return null;

  const previousApplicationYears = await getPreviousApplicationYears(
    res.candidates.map((c) => ({
      userId: c.candidate.userId,
      studentNumber: c.candidate.application?.studentNumber,
    })),
    res.recruitmentId,
  );

  const votingDecisions = await getLatestVotingDecisionsForCandidates(
    res.candidates.map((c) => c.candidate.userId),
    recruitmentId ?? res.recruitmentId,
  );

  return {
    ...res,
    candidates: await Promise.all(
      res.candidates.map(async (c) => ({
        ...c.candidate.user,
        image: await getFilenameUrl(c.candidate.user?.image),
        application: c.candidate.application
          ? {
              ...c.candidate.application,
              curriculum: await getFilenameUrl(
                c.candidate.application?.curriculum,
              ),
              interests: c.candidate.application?.interests.map(
                (i) => i.interest,
              ),
            }
          : null,
        interviewClassification: c.candidate.interviewClassification,
        dynamicClassification: c.candidate.dynamicClassification,
        dynamic: c.candidate.dynamic,
        interview: c.candidate.interview,
        knownRecruiters: c.candidate.knownRecruiters,
        previousApplicationYears:
          previousApplicationYears.get(c.candidate.userId) ?? [],
        votingDecision: votingDecisions.get(c.candidate.userId) ?? null,
      })),
    ),
  };
}

export async function getDynamicInterviewers(dynamicId: number) {
  const interviewers = await db.query.recruiterToDynamic.findMany({
    where: eq(recruiterToDynamic.dynamicId, dynamicId),
    with: {
      recruiter: {
        with: {
          user: true,
        },
      },
    },
  });
  return interviewers.map((interviewer) => interviewer.recruiter.user);
}

export async function getCandidateDynamic(
  candidateId: string,
  recruitmentId?: number,
) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  if (!targetId) return null;

  const link = await db.query.candidateToDynamic.findFirst({
    where: and(
      eq(candidateToDynamic.candidateId, candidateId),
      eq(candidateToDynamic.recruitmentId, targetId),
    ),
  });

  if (!link) return null;

  return await db.query.dynamic.findFirst({
    where: eq(dynamic.id, link.dynamicId),
    with: {
      candidates: {
        with: {
          candidate: {
            with: {
              user: true,
              application: {
                with: {
                  interests: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function updateDynamic(dynamicId: number, content: unknown) {
  await db.update(dynamic).set({ content }).where(eq(dynamic.id, dynamicId));
}

export async function createDynamicComment(
  dynamicId: number,
  content: Array<any>,
  authorId: string,
): Promise<number | null> {
  return await db.transaction(async (trx) => {
    try {
      const inserted = await trx
        .insert(dynamicComment)
        .values({
          content: content,
          dynamicId: dynamicId,
          authorId: authorId,
        })
        .returning({ id: dynamicComment.id });

      return inserted[0]?.id ?? null;
    } catch (e) {
      console.error(e);
      return null;
    }
  });
}

export async function updateDynamicComment(
  commentId: number,
  content: Array<any>,
  authorId: string,
  dynamicId: number,
  recruitmentId: number,
): Promise<boolean> {
  const d = await db
    .select({ id: dynamic.id })
    .from(dynamic)
    .where(
      and(eq(dynamic.id, dynamicId), eq(dynamic.recruitmentId, recruitmentId)),
    );

  if (d.length === 0) return false;

  const updated = await db
    .update(dynamicComment)
    .set({ content, editedAt: new Date() })
    .where(
      and(
        eq(dynamicComment.id, commentId),
        eq(dynamicComment.authorId, authorId),
        eq(dynamicComment.dynamicId, d[0].id),
      ),
    )
    .returning({ id: dynamicComment.id });

  return updated.length > 0;
}

export async function getAllCandidatesWithDynamic(
  recruitmentIdOrRestrictions?: number | Array<CandidateFilterRestriction>,
  restrictionsParam?: Array<CandidateFilterRestriction>,
): Promise<Array<CandidateWithMetadata>> {
  const recruitmentId =
    typeof recruitmentIdOrRestrictions === "number"
      ? recruitmentIdOrRestrictions
      : undefined;
  const restrictions = Array.isArray(recruitmentIdOrRestrictions)
    ? recruitmentIdOrRestrictions
    : restrictionsParam;

  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  const candidates = await db.query.candidate.findMany({
    where: (candidateTable, { eq, and, exists }) =>
      and(
        eq(candidateTable.recruitmentId, targetId),
        exists(
          db
            .select()
            .from(application)
            .where(
              and(
                eq(application.candidateId, candidateTable.userId),
                eq(application.recruitmentId, targetId),
              ),
            ),
        ),
      ),
    with: {
      user: true,
      interview: true,
      dynamic: {
        with: {
          dynamic: {
            with: {
              slot: true,
            },
          },
        },
      },
      application: {
        with: {
          interests: true,
        },
      },
      knownRecruiters: true,
    },
  });

  candidates.sort(
    (a, b) => (a.application?.id ?? 0) - (b.application?.id ?? 0),
  );

  const previousApplicationYears = await getPreviousApplicationYears(
    candidates.map((c) => ({
      userId: c.userId,
      studentNumber: c.application?.studentNumber,
    })),
    targetId,
  );

  const votingDecisions = await getLatestVotingDecisionsForCandidates(
    candidates.map((c) => c.userId),
    targetId,
  );

  const res: Array<CandidateWithMetadata> = await Promise.all(
    candidates.map(async (c) => {
      return {
        ...c.user,
        image: await getFilenameUrl(c.user?.image),
        dynamic: c.dynamic as CandidateWithMetadata["dynamic"],
        interview: c.interview as CandidateWithMetadata["interview"],
        interviewClassification: c.interviewClassification ?? "none",
        dynamicClassification: c.dynamicClassification ?? "none",
        application: c.application
          ? {
              ...c.application,
              curriculum: await getFilenameUrl(c.application?.curriculum),
              interests: c.application?.interests.map((i) => i.interest),
            }
          : null,
        knownRecruiters: c.knownRecruiters,
        votingDecision: votingDecisions.get(c.userId) ?? null,
        previousApplicationYears: previousApplicationYears.get(c.userId) ?? [],
      };
    }),
  );

  let filtered = res;
  for (const restriction of restrictions ?? []) {
    filtered = candidateFilterRestrictions[restriction](filtered);
  }

  return Promise.resolve(filtered);
}

export async function addDynamicTemplate(content: Array<any>) {
  if (content.length === 0) return;

  await db.transaction(async (trx) => {
    const template = await trx.query.dynamicTemplate.findFirst();

    if (template) {
      await trx.update(dynamicTemplate).set({ content: content });
      return;
    }

    await trx.insert(dynamicTemplate).values({ content: content });
  });
}

export async function getDynamicTemplate(): Promise<DynamicTemplate> {
  const template =
    (await db.query.dynamicTemplate.findFirst()) as DynamicTemplate;

  if (!template) {
    return {
      id: 0,
      content: [],
    };
  }

  return template;
}

export function getDynamicLink(dynamicId: number) {
  return `/dynamic/${dynamicId}`;
}
