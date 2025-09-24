import { candidateToDynamic, dynamic, dynamicComment, slot } from "@/db/schema";
import { db, Slot } from "./db";
import { eq } from "drizzle-orm";

export async function addCandidateToDynamic(
  candidateId: string,
  dynamicId: number,
) {
  await db.insert(candidateToDynamic).values({
    candidateId: candidateId,
    dynamicId: dynamicId,
  });
}

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

    if (candidateToDynamic) {
      await trx
        .update(slot)
        .set({ quantity: candidateDynamic.dynamic.slot.quantity - 1 })
        .where(eq(slot.id, slotParam.id));
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
        .where(eq(dynamic.slotId, slotParam.id))
        .for("update");

      if (possibleDynamic.length === 0) {
        const [insertedDynamic] = await trx
          .insert(dynamic)
          .values({
            slotId: slotParam.id,
            content: "",
          })
          .returning({ id: dynamic.id });

        addCandidateToDynamic(candidateId, insertedDynamic.id);
      } else {
        addCandidateToDynamic(candidateId, possibleDynamic[0].id);
      }
    }
  });
}

export async function getDynamic(dynamicId: number) {
  return await db.query.dynamic.findFirst({
    where: eq(dynamic.id, dynamicId),
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

export async function getCandidateDynamic(candidateId: string) {
  return await db.query.dynamic.findFirst({
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
  content: string,
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

export async function getAllCandidatesWithDynamic() {
  const candidates = await db.query.candidate.findMany({
    with: {
      user: true,
      dynamic: true,
      application: {
        with: {
          interests: true,
        },
      },
      knownRecruiters: true,
    },
  });

  return candidates.map((c) => ({
    ...c.user,
    dynamic: c.dynamic,
    application: {
      ...c.application,
      interests: c.application.interests.map((i) => i.interest),
    },
    knownRecruiters: c.knownRecruiters,
  }));
}
