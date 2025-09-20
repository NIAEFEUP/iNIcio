import { interview } from "@/db/schema";
import { db, Slot } from "./db";

export default async function addInterviewWithSlot(
  candidateId: string,
  slot: Slot,
) {
  await db.insert(interview).values({
    slot: slot.id,
    candidateId: candidateId,
    content: "",
  });
}
