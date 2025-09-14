import {
  recruitment,
  recruitmentPhase,
  recruitmentPhaseSlot,
  recruitmentPhaseStatus,
} from "@/db/schema";
import { db } from "./db";
import { and, eq, or } from "drizzle-orm";

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

export async function getRecruitmentPhases() {
  const currentYear = new Date().getFullYear();

  const recruitmentPhases = await db
    .select()
    .from(recruitmentPhase)
    .where(eq(recruitmentPhase.recruitmentYear, currentYear));

  return recruitmentPhases;
}

export async function getInterviewSlots() {
  const currentYear = new Date().getFullYear();

  const interviewSlots = await db
    .select()
    .from(recruitmentPhaseSlot)
    .where(
      or(
        and(
          eq(recruitmentPhaseSlot.type, "interview-dynamic"),
          eq(recruitmentPhaseSlot.recruitmentYear, currentYear),
        ),
        and(
          eq(recruitmentPhaseSlot.type, "interview"),
          eq(recruitmentPhaseSlot.recruitmentYear, currentYear),
        ),
      ),
    );

  return interviewSlots;
}

export async function getDynamicSlots() {
  const currentYear = new Date().getFullYear();

  const dynamicSlots = await db
    .select()
    .from(recruitmentPhaseSlot)
    .where(
      or(
        and(
          eq(recruitmentPhaseSlot.type, "dynamic"),
          eq(recruitmentPhaseSlot.recruitmentYear, currentYear),
        ),
        and(
          eq(recruitmentPhaseSlot.type, "interview-dynamic"),
          eq(recruitmentPhaseSlot.recruitmentYear, currentYear),
        ),
      ),
    );

  return dynamicSlots;
}

export async function isRecruitmentPhaseDone(
  userId: string | undefined,
  phaseId: number,
) {
  if (!userId) return false;

  const phase = await db
    .select()
    .from(recruitmentPhaseStatus)
    .where(
      and(
        eq(recruitmentPhaseStatus.userId, userId),
        eq(recruitmentPhaseStatus.phaseId, phaseId),
        eq(recruitmentPhaseStatus.status, "done"),
      ),
    );

  return phase.length > 0;
}
