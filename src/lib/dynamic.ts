import {
  candidateToDynamic,
  dynamic,
  dynamicComment,
  dynamicTemplate,
  slot,
  recruiterToDynamic,
} from "@/db/schema";
import { db, DynamicTemplate, Slot } from "./db";
import { and, eq } from "drizzle-orm";
import { getFilenameUrl } from "./file-upload";
import { application } from "@/db/schema";
import {
  CandidateFilterRestriction,
  candidateFilterRestrictions,
  CandidateWithMetadata,
} from "./candidate";
import { getLatestVotingDecisionForCandidate } from "./voting";
import { getActiveRecruitment } from "./recruitment";

export async function tryToAddCandidateToDynamic(
  candidateId: string,
  slotParam: Slot,
  recruitmentId?: number,
) {
  const targetRecruitmentId =
    recruitmentId ??
    slotParam.recruitmentId ??
    (await getActiveRecruitment())?.id;

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
      .where(eq(slot.id, slotParam.id))
      .for("update");

    if (s.length > 0) {
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
    } else {
      throw new Error("Slot not found");
    }
  });
}

export async function getDynamic(dynamicId: number) {
  const res = await db.query.dynamic.findFirst({
    where: eq(dynamic.id, dynamicId),
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

  return {
    ...res,
    candidates: await Promise.all(
      res.candidates.map(async (c) => ({
        ...c.candidate.user,
        application: {
          ...c.candidate.application,
          profilePicture: await getFilenameUrl(
            c.candidate.application?.profilePicture,
          ),
          interests: c.candidate.application?.interests.map((i) => i.interest),
        },
        interviewClassification: c.candidate.interviewClassification,
        dynamicClassification: c.candidate.dynamicClassification,
        dynamic: c.candidate.dynamic,
        interview: c.candidate.interview,
        knownRecruiters: c.candidate.knownRecruiters,
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
  return await db.query.dynamic.findFirst({
    where: targetId ? eq(dynamic.recruitmentId, targetId) : undefined,
    with: {
      candidates: {
        where: targetId
          ? and(
              eq(candidateToDynamic.candidateId, candidateId),
              eq(candidateToDynamic.recruitmentId, targetId),
            )
          : eq(candidateToDynamic.candidateId, candidateId),
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

export async function updateDynamic(dynamicId: number, content: any) {
  await db.transaction(async (trx) => {
    try {
      await trx
        .update(dynamic)
        .set({ content: content })
        .where(eq(dynamic.id, dynamicId));
    } catch (e) {
      console.error(e);
    }
  });
}

export async function createDynamicComment(
  dynamicId: number,
  content: Array<any>,
  authorId: string,
) {
  await db.transaction(async (trx) => {
    try {
      await trx
        .insert(dynamicComment)
        .values({
          content: content,
          dynamicId: dynamicId,
          authorId: authorId,
        })
        .returning({ id: dynamicComment.id });
    } catch (e) {
      console.error(e);
    }
  });
}

export async function getAllCandidatesWithDynamic(
  recruitmentId?: number,
  restrictions?: Array<CandidateFilterRestriction>,
): Promise<Array<CandidateWithMetadata>> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  const candidates = await db.query.candidate.findMany({
    where: (candidateTable, { eq, and, exists }) => {
      const conditions = [
        exists(
          db
            .select()
            .from(application)
            .where(
              targetId
                ? and(
                    eq(application.candidateId, candidateTable.userId),
                    eq(application.recruitmentId, targetId),
                  )
                : eq(application.candidateId, candidateTable.userId),
            ),
        ),
      ];
      if (targetId) {
        conditions.push(eq(candidateTable.recruitmentId, targetId));
      }
      return and(...conditions);
    },
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

  const res: Array<CandidateWithMetadata> = await Promise.all(
    candidates.map(async (c) => {
      const votingDecision = targetId
        ? await getLatestVotingDecisionForCandidate(c.userId, targetId)
        : await getLatestVotingDecisionForCandidate(c.userId);

      return {
        ...c.user,
        dynamic: c.dynamic as any,
        interview: c.interview as any,
        interviewClassification: c.interviewClassification ?? "none",
        dynamicClassification: c.dynamicClassification ?? "none",
        application: c.application
          ? {
              ...c.application,
              profilePicture: await getFilenameUrl(
                c.application?.profilePicture,
              ),
              interests: c.application?.interests.map((i) => i.interest),
            }
          : null,
        knownRecruiters: c.knownRecruiters,
        votingDecision,
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
