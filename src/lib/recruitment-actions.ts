"use server";

import { Recruitment } from "@/lib/db";
import {
  addRecruitment,
  deleteRecruitment,
  duplicatePhasesFromPreviousRecruitment,
  editRecruitment,
  getRecruitmentById,
} from "./recruitment";

export interface RecruitmentInput {
  lectiveYear: string;
  semester: number;
  title: string;
  start: string;
  end: string;
  active: boolean;
}

function parseRecruitment(input: RecruitmentInput): Omit<Recruitment, "id"> {
  const start = new Date(input.start);
  const end = new Date(input.end);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    throw new Error("A data de fim tem de ser posterior à data de início");
  }

  return {
    lectiveYear: input.lectiveYear,
    semester: input.semester,
    title: input.title,
    start,
    end,
    active: input.active,
  };
}

export async function createRecruitment(
  input: RecruitmentInput,
): Promise<Recruitment> {
  const recruitment = parseRecruitment(input);
  const created = await addRecruitment(recruitment);

  const full = await getRecruitmentById(created.id);
  if (!full) throw new Error("Recrutamento não encontrado");

  return full;
}

export async function updateRecruitment(
  id: number,
  input: RecruitmentInput,
): Promise<void> {
  const recruitment = parseRecruitment(input);
  await editRecruitment({ id, ...recruitment });
}

export async function removeRecruitment(id: number): Promise<void> {
  await deleteRecruitment(id);
}

export async function duplicateRecruitmentPhases(id: number): Promise<number> {
  return duplicatePhasesFromPreviousRecruitment(id);
}
