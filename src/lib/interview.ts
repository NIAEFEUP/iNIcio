import { interview, interviewComment, slot } from "@/db/schema";
import { db, Slot } from "./db";
import { and, eq, gt } from "drizzle-orm";

export default async function addInterviewWithSlot(
  candidateId: string,
  slotParam: Slot,
) {
  await db.transaction(async (trx) => {
    const s = await trx
      .select()
      .from(slot)
      .where(and(eq(slot.id, slotParam.id), gt(slot.quantity, 0)))
      .for("update");

    if (s.length > 0) {
      await trx
        .update(slot)
        .set({ quantity: s[0].quantity - 1 })
        .where(eq(slot.id, slotParam.id));

      await trx.insert(interview).values({
        slot: slotParam.id,
        candidateId: candidateId,
        content: "",
      });
    }
  });
}

export async function getInterview(candidateId: string) {
  const interviews = await db
    .select()
    .from(interview)
    .where(eq(interview.candidateId, candidateId));
  return interviews[0];
}

export async function updateInterview(candidateId: string, content: any) {
  await db.transaction(async (trx) => {
    await trx
      .update(interview)
      .set({ content: content })
      .where(eq(interview.candidateId, candidateId));
  });
}

export async function addInterviewComment(
  authorId: string,
  content: string,
  candidateId: string,
): Promise<boolean> {
  await db.transaction(async (trx) => {
    const i = await trx
      .select()
      .from(interview)
      .where(eq(interview.candidateId, candidateId))
      .for("update");

    if (i.length === 0) return false;

    try {
      await trx.insert(interviewComment).values({
        content: content,
        authorId: authorId,
        interviewId: i[0].id,
      });

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  });
}
