"use server";

import { and, eq, gt, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db, Slot } from "@/lib/db";
import {
  candidateToDynamic,
  dynamic,
  interview,
  recruitmentPhase,
  slot,
} from "@/db/schema";
import { getSessionUser } from "@/lib/action-guard";
import addInterviewWithSlot from "@/lib/interview";
import { tryToAddCandidateToDynamic } from "@/lib/dynamic";
import {
  getActiveRecruitment,
  markDynamicRecruitmentPhaseAsDone,
  markInterviewRecruitmentPhaseAsDone,
} from "@/lib/recruitment";
import {
  getPhaseState,
  RECRUITMENT_PHASE_IDENTIFIERS,
} from "@/lib/recruitment-state";

export async function bookOrChangeInterviewSlot(slotId: number) {
  const user = await getSessionUser();
  const activeRecruitment = await getActiveRecruitment();

  if (!activeRecruitment) {
    throw new Error("Não existe nenhum período de recrutamento ativo.");
  }

  // Verify interview phase is currently open
  const interviewPhase = await db.query.recruitmentPhase.findFirst({
    where: and(
      eq(recruitmentPhase.recruitmentId, activeRecruitment.id),
      sql`lower(trim(${recruitmentPhase.clientIdentifier})) = ${RECRUITMENT_PHASE_IDENTIFIERS.interview}`,
    ),
  });

  if (interviewPhase) {
    const phaseState = getPhaseState(interviewPhase, new Date());
    if (phaseState !== "open") {
      throw new Error(
        "O período de agendamento de entrevistas já não se encontra ativo.",
      );
    }
  }

  // Find the selected slot
  const targetSlot = await db.query.slot.findFirst({
    where: and(
      eq(slot.id, slotId),
      eq(slot.type, "interview"),
      eq(slot.recruitmentId, activeRecruitment.id),
    ),
  });

  if (!targetSlot) {
    throw new Error("Horário não encontrado.");
  }

  await addInterviewWithSlot(user.id, targetSlot, activeRecruitment.id);
  await markInterviewRecruitmentPhaseAsDone(user.id);

  revalidatePath("/candidate/progress");
  return { success: true };
}

export async function bookOrChangeDynamicSlot(slotId: number) {
  const user = await getSessionUser();
  const activeRecruitment = await getActiveRecruitment();

  if (!activeRecruitment) {
    throw new Error("Não existe nenhum período de recrutamento ativo.");
  }

  // Verify dynamic phase is currently open
  const dynamicPhase = await db.query.recruitmentPhase.findFirst({
    where: and(
      eq(recruitmentPhase.recruitmentId, activeRecruitment.id),
      sql`lower(trim(${recruitmentPhase.clientIdentifier})) = ${RECRUITMENT_PHASE_IDENTIFIERS.dynamic}`,
    ),
  });

  if (dynamicPhase) {
    const phaseState = getPhaseState(dynamicPhase, new Date());
    if (phaseState !== "open") {
      throw new Error(
        "O período de agendamento da dinâmica já não se encontra ativo.",
      );
    }
  }

  // Find the selected slot
  const targetSlot = await db.query.slot.findFirst({
    where: and(
      eq(slot.id, slotId),
      eq(slot.type, "dynamic"),
      eq(slot.recruitmentId, activeRecruitment.id),
    ),
  });

  if (!targetSlot) {
    throw new Error("Sessão de dinâmica não encontrada.");
  }

  await tryToAddCandidateToDynamic(user.id, targetSlot, activeRecruitment.id);
  await markDynamicRecruitmentPhaseAsDone(user.id);

  revalidatePath("/candidate/progress");
  return { success: true };
}
