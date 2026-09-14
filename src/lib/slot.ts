import { slot } from "@/db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { getActiveRecruitment } from "./recruitment";

export default async function getExistingSlots(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) {
    return {
      interview: [],
      dynamic: [],
    };
  }

  const slots = await db
    .select()
    .from(slot)
    .where(eq(slot.recruitmentId, targetId));

  return {
    interview: slots.filter((s) => s.type === "interview"),
    dynamic: slots.filter((s) => s.type === "dynamic"),
  };
}
