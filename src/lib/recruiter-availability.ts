import { and, eq, lt, ne, sql } from "drizzle-orm";
import {
  dynamic,
  interview,
  recruiterAvailability,
  recruiterToDynamic,
  recruiterToInterview,
  slot,
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

  const [availability, interviewConflict, dynamicConflict] = await Promise.all([
    client
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
      .limit(1),
    client
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
      .limit(1),
    client
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
      .limit(1),
  ]);

  return (
    availability.length > 0 &&
    interviewConflict.length === 0 &&
    dynamicConflict.length === 0
  );
}
