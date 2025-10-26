import {
  candidateToDynamic,
  dynamic,
  dynamicComment,
  dynamicTemplate,
  slot,
  recruiterToDynamic,
} from "@/db/schema";
import { db, DynamicTemplate, Slot } from "./db";
import { eq } from "drizzle-orm";
import { getFilenameUrl } from "./file-upload";
import { application } from "@/drizzle/schema";
import { FilterRestriction } from "./restriction";
import {
  CandidateFilterRestriction,
  candidateFilterRestrictions,
} from "./candidate";

export async function tryToAddCandidateToDynamic(
  candidateId: string,
  slotParam: Slot,
) {
  await db.transaction(async (trx) => {
    const candidateDynamic = await db.query.candidateToDynamic.findFirst({
      where: eq(candidateToDynamic.candidateId, candidateId),
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
        .where(eq(candidateToDynamic.candidateId, candidateId));
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
            content: dynamicTemplate ? dynamicTemplate.content : [],
          })
          .returning({ id: dynamic.id });

        await trx.insert(candidateToDynamic).values({
          candidateId: candidateId,
          dynamicId: insertedDynamic.id,
        });
      } else {
        await trx.insert(candidateToDynamic).values({
          candidateId: candidateId,
          dynamicId: possibleDynamic[0].id,
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

export async function getCandidateDynamic(candidateId: string) {
  const res = await db.query.dynamic.findFirst({
    with: {
      candidates: {
        where: eq(candidateToDynamic.candidateId, candidateId),
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
  restrictions: Array<CandidateFilterRestriction> = [],
) {
  const candidates = await db.query.candidate.findMany({
    where: (candidate, { exists }) =>
      exists(
        db
          .select()
          .from(application)
          .where(eq(application.candidateId, candidate.userId)),
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

  candidates.sort((a, b) => a.application.id - b.application.id);

  const res = await Promise.all(
    candidates.map(async (c) => ({
      ...c.user,
      dynamic: c.dynamic,
      interview: c.interview,
      interviewClassification: c.interviewClassification,
      dynamicClassification: c.dynamicClassification,
      application: {
        ...c.application,
        profilePicture: await getFilenameUrl(c.application?.profilePicture),
        interests: c.application?.interests.map((i) => i.interest),
      },
      knownRecruiters: c.knownRecruiters,
    })),
  );

  if (restrictions.length > 0) {
    return restrictions.reduce(
      (result, filter) => candidateFilterRestrictions[filter](result),
      res,
    );
  }

  return res;
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
