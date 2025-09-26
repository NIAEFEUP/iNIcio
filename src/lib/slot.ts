import { slot } from "@/db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export default async function getExistingSlots(recruitmentYear: number) {
  const slots = await db
    .select()
    .from(slot)
    .where(eq(slot.recruitmentYear, recruitmentYear));

  return {
    interview: slots.filter((s) => s.type === "interview"),
    dynamic: slots.filter((s) => s.type === "dynamic"),
  };
}
