import { candidateToDynamic, dynamic, slot } from "@/db/schema";
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
