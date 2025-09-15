import { candidateToDynamic, dynamic } from "@/db/schema";
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
  slot: Slot,
) {
  const possibleDynamic = await db
    .select()
    .from(dynamic)
    .where(eq(dynamic.slotId, slot.id));

  if (possibleDynamic.length === 0) {
    const [insertedDynamic] = await db
      .insert(dynamic)
      .values({
        slotId: slot.id,
        content: "",
      })
      .returning({ id: dynamic.id });

    addCandidateToDynamic(candidateId, insertedDynamic.id);
  } else {
    addCandidateToDynamic(candidateId, possibleDynamic[0].id);
  }
}
