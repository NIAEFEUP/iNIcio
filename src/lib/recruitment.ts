import { recruitment } from "@/db/schema";
import { db } from "./db";
import { and, eq } from "drizzle-orm";

export async function isRecruitmentActive() {
  const currentYear = new Date().getFullYear();

  const currentRecrutment = await db
    .select()
    .from(recruitment)
    .where(
      and(eq(recruitment.year, currentYear), eq(recruitment.active, "true")),
    );

  return currentRecrutment.length > 0;
}
