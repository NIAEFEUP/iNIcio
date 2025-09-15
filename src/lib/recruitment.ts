import {
  recruitment,
  recruitmentPhase,
  recruitmentPhaseStatus,
  slot,
} from "@/db/schema";
import { db, RecruitmentPhase, Slot } from "./db";
import { and, eq, or, sql } from "drizzle-orm";

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
    .from(slot)
    .where(
      or(
        and(
          eq(slot.type, "interview-dynamic"),
          eq(slot.recruitmentYear, currentYear),
        ),
        and(eq(slot.type, "interview"), eq(slot.recruitmentYear, currentYear)),
      ),
    );

  return interviewSlots;
}

export async function getDynamicSlots() {
  const currentYear = new Date().getFullYear();

  const dynamicSlots = await db
    .select()
    .from(slot)
    .where(
      or(
        and(eq(slot.type, "dynamic"), eq(slot.recruitmentYear, currentYear)),
        and(
          eq(slot.type, "interview-dynamic"),
          eq(slot.recruitmentYear, currentYear),
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

export async function markInterviewRecruitmentPhaseAsDone(userId: string) {
  const phaseStatus = await db
    .select({
      phaseId: recruitmentPhaseStatus.phaseId,
      status: recruitmentPhaseStatus.status,
      title: recruitmentPhase.title,
    })
    .from(recruitmentPhaseStatus)
    .innerJoin(
      recruitmentPhase,
      eq(recruitmentPhaseStatus.phaseId, recruitmentPhase.id),
    )
    .where(
      and(
        eq(recruitmentPhaseStatus.userId, userId),
        eq(recruitmentPhase.title, "Entrevista"),
      ),
    );

  await db
    .update(recruitmentPhaseStatus)
    .set({ status: "done" })
    .where(eq(recruitmentPhaseStatus.phaseId, phaseStatus[0].phaseId));
}
