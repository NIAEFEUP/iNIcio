import "server-only";

import { inArray } from "drizzle-orm";

import { recruiterToDynamic, recruiterToInterview } from "@/db/schema";
import { db, type User } from "./db";

/** Recruiters assigned to a candidate's interview and to their dynamic. */
export interface CandidateFacilitators {
  interviewers: User[];
  facilitators: User[];
}

/** Interviewers keyed by interview id, for every interview in one query. */
export async function getInterviewersByInterviewId(
  interviewIds: number[],
): Promise<Map<number, User[]>> {
  const map = new Map<number, User[]>();
  if (interviewIds.length === 0) return map;

  const rows = await db.query.recruiterToInterview.findMany({
    where: inArray(recruiterToInterview.interviewId, interviewIds),
    with: { recruiter: { with: { user: true } } },
  });

  for (const row of rows) {
    const list = map.get(row.interviewId) ?? [];
    list.push(row.recruiter.user);
    map.set(row.interviewId, list);
  }
  return map;
}

/** Dynamic facilitators keyed by dynamic id, for every dynamic in one query. */
export async function getFacilitatorsByDynamicId(
  dynamicIds: number[],
): Promise<Map<number, User[]>> {
  const map = new Map<number, User[]>();
  if (dynamicIds.length === 0) return map;

  const rows = await db.query.recruiterToDynamic.findMany({
    where: inArray(recruiterToDynamic.dynamicId, dynamicIds),
    with: { recruiter: { with: { user: true } } },
  });

  for (const row of rows) {
    const list = map.get(row.dynamicId) ?? [];
    list.push(row.recruiter.user);
    map.set(row.dynamicId, list);
  }
  return map;
}

/** Builds the per-candidate facilitators map from the phase's candidate list. */
export async function getCandidateFacilitators(
  candidates: Array<{
    id: string;
    interview: { id: number } | null;
    dynamic: { dynamicId: number } | null;
  }>,
): Promise<Record<string, CandidateFacilitators>> {
  const interviewIds = candidates
    .map((c) => c.interview?.id)
    .filter((id): id is number => typeof id === "number");
  const dynamicIds = candidates
    .map((c) => c.dynamic?.dynamicId)
    .filter((id): id is number => typeof id === "number");

  const [interviewersMap, facilitatorsMap] = await Promise.all([
    getInterviewersByInterviewId(interviewIds),
    getFacilitatorsByDynamicId(dynamicIds),
  ]);

  const result: Record<string, CandidateFacilitators> = {};
  for (const candidate of candidates) {
    result[candidate.id] = {
      interviewers: candidate.interview
        ? (interviewersMap.get(candidate.interview.id) ?? [])
        : [],
      facilitators: candidate.dynamic
        ? (facilitatorsMap.get(candidate.dynamic.dynamicId) ?? [])
        : [],
    };
  }
  return result;
}
