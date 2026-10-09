import { and, eq, inArray, lt, ne, sql } from "drizzle-orm";
import {
  candidateToDynamic,
  dynamic,
  interview,
  recruiterAvailability,
  recruiterToDynamic,
  recruiterToInterview,
  slot,
  user,
} from "@/db/schema";
import { db } from "./db";

type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface RecruiterSlotCheck {
  excludeInterviewId?: number;
  excludeDynamicId?: number;
}

/**
 * Predicate matching declared availability windows that overlap
 * `[start, end)` for a recruitment, optionally for a single recruiter.
 */
export function availabilityOverlapCondition(
  start: Date,
  end: Date,
  recruitmentId: number,
  recruiterId?: string,
) {
  return and(
    lt(recruiterAvailability.start, end),
    sql`${recruiterAvailability.start} + make_interval(mins => ${recruiterAvailability.duration}) > ${sql.param(start, recruiterAvailability.start)}`,
    eq(recruiterAvailability.recruitmentId, recruitmentId),
    recruiterId !== undefined
      ? eq(recruiterAvailability.recruiterId, recruiterId)
      : undefined,
  );
}

/** Predicate matching `slot` rows whose window overlaps `[start, end)`. */
function slotOverlapCondition(start: Date, end: Date) {
  return and(
    lt(slot.start, end),
    sql`${slot.start} + make_interval(mins => ${slot.duration}) > ${sql.param(start, slot.start)}`,
  );
}

/**
 * A recruiter can cover a session only if they declared availability that
 * overlaps it and have no other interview or dynamic at an overlapping time.
 * Availability is scoped to the recruitment, but conflicts are checked across
 * every recruitment since a recruiter cannot be in two places at once.
 */
export async function isRecruiterAvailableForSlot(
  recruiterId: string,
  recruitmentId: number,
  slotStart: Date,
  slotDuration: number,
  options: RecruiterSlotCheck = {},
  client: DbClient = db,
): Promise<boolean> {
  const slotEnd = new Date(slotStart.getTime() + slotDuration * 60_000);

  // Queries run sequentially: a transaction client cannot execute two queries
  // concurrently (deprecated by `pg`), and a missing availability already
  // short-circuits the conflict checks.
  const availability = await client
    .select({ id: recruiterAvailability.id })
    .from(recruiterAvailability)
    .where(
      availabilityOverlapCondition(
        slotStart,
        slotEnd,
        recruitmentId,
        recruiterId,
      ),
    )
    .limit(1);

  if (availability.length === 0) return false;

  const interviewConflict = await client
    .select({ id: interview.id })
    .from(recruiterToInterview)
    .innerJoin(interview, eq(interview.id, recruiterToInterview.interviewId))
    .innerJoin(slot, eq(slot.id, interview.slot))
    .where(
      and(
        eq(recruiterToInterview.recruiterId, recruiterId),
        slotOverlapCondition(slotStart, slotEnd),
        options.excludeInterviewId !== undefined
          ? ne(interview.id, options.excludeInterviewId)
          : undefined,
      ),
    )
    .limit(1);

  if (interviewConflict.length > 0) return false;

  const dynamicConflict = await client
    .select({ id: dynamic.id })
    .from(recruiterToDynamic)
    .innerJoin(dynamic, eq(dynamic.id, recruiterToDynamic.dynamicId))
    .innerJoin(slot, eq(slot.id, dynamic.slot))
    .where(
      and(
        eq(recruiterToDynamic.recruiterId, recruiterId),
        slotOverlapCondition(slotStart, slotEnd),
        options.excludeDynamicId !== undefined
          ? ne(dynamic.id, options.excludeDynamicId)
          : undefined,
      ),
    )
    .limit(1);

  return dynamicConflict.length === 0;
}

export interface RemovedWindow {
  start: Date;
  duration: number;
}

export interface UnassignedSession {
  kind: "interview" | "dynamic";
  id: number;
  slotStart: Date;
  candidateNames: string[];
}

function overlaps(
  window: RemovedWindow,
  slotStart: Date,
  slotDuration: number,
): boolean {
  const windowEnd = new Date(window.start.getTime() + window.duration * 60_000);
  const slotEnd = new Date(slotStart.getTime() + slotDuration * 60_000);

  return slotStart < windowEnd && slotEnd > window.start;
}

/**
 * Removes the recruiter from any assigned interview or dynamic in the
 * recruitment whose slot overlaps one of the removed availability windows and
 * is no longer backed by surviving availability. Returns the sessions the
 * recruiter was removed from.
 */
export async function pruneUnavailableAssignments(
  recruiterId: string,
  recruitmentId: number,
  removedWindows: RemovedWindow[],
  client: DbClient = db,
): Promise<UnassignedSession[]> {
  if (removedWindows.length === 0) return [];

  // Queries run sequentially: a transaction client cannot execute two queries
  // concurrently (deprecated by `pg`).
  const interviewRows = await client
    .select({
      id: interview.id,
      slotStart: slot.start,
      slotDuration: slot.duration,
      candidateName: user.name,
    })
    .from(recruiterToInterview)
    .innerJoin(interview, eq(interview.id, recruiterToInterview.interviewId))
    .innerJoin(slot, eq(slot.id, interview.slot))
    .innerJoin(user, eq(user.id, interview.candidateId))
    .where(
      and(
        eq(recruiterToInterview.recruiterId, recruiterId),
        eq(interview.recruitmentId, recruitmentId),
      ),
    );

  const dynamicRows = await client
    .select({
      id: dynamic.id,
      slotStart: slot.start,
      slotDuration: slot.duration,
    })
    .from(recruiterToDynamic)
    .innerJoin(dynamic, eq(dynamic.id, recruiterToDynamic.dynamicId))
    .innerJoin(slot, eq(slot.id, dynamic.slot))
    .where(
      and(
        eq(recruiterToDynamic.recruiterId, recruiterId),
        eq(dynamic.recruitmentId, recruitmentId),
      ),
    );

  const dynamicIds = dynamicRows.map((row) => row.id);
  const dynamicCandidateRows =
    dynamicIds.length > 0
      ? await client
          .select({
            dynamicId: candidateToDynamic.dynamicId,
            name: user.name,
          })
          .from(candidateToDynamic)
          .innerJoin(user, eq(user.id, candidateToDynamic.candidateId))
          .where(inArray(candidateToDynamic.dynamicId, dynamicIds))
      : [];

  const dynamicCandidateNames = new Map<number, string[]>();
  for (const row of dynamicCandidateRows) {
    const names = dynamicCandidateNames.get(row.dynamicId) ?? [];
    if (row.name) names.push(row.name);
    dynamicCandidateNames.set(row.dynamicId, names);
  }

  const unassigned: UnassignedSession[] = [];

  for (const row of interviewRows) {
    if (
      !removedWindows.some((w) => overlaps(w, row.slotStart, row.slotDuration))
    ) {
      continue;
    }

    const stillAvailable = await isRecruiterAvailableForSlot(
      recruiterId,
      recruitmentId,
      row.slotStart,
      row.slotDuration,
      { excludeInterviewId: row.id },
      client,
    );

    if (!stillAvailable) {
      await client
        .delete(recruiterToInterview)
        .where(
          and(
            eq(recruiterToInterview.recruiterId, recruiterId),
            eq(recruiterToInterview.interviewId, row.id),
          ),
        );
      unassigned.push({
        kind: "interview",
        id: row.id,
        slotStart: row.slotStart,
        candidateNames: row.candidateName ? [row.candidateName] : [],
      });
    }
  }

  for (const row of dynamicRows) {
    if (
      !removedWindows.some((w) => overlaps(w, row.slotStart, row.slotDuration))
    ) {
      continue;
    }

    const stillAvailable = await isRecruiterAvailableForSlot(
      recruiterId,
      recruitmentId,
      row.slotStart,
      row.slotDuration,
      { excludeDynamicId: row.id },
      client,
    );

    if (!stillAvailable) {
      await client
        .delete(recruiterToDynamic)
        .where(
          and(
            eq(recruiterToDynamic.recruiterId, recruiterId),
            eq(recruiterToDynamic.dynamicId, row.id),
          ),
        );
      unassigned.push({
        kind: "dynamic",
        id: row.id,
        slotStart: row.slotStart,
        candidateNames: dynamicCandidateNames.get(row.id) ?? [],
      });
    }
  }

  return unassigned;
}
