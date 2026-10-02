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
 * A recruiter can cover a session only if they declared availability that
 * overlaps it and have no other interview or dynamic at an overlapping time.
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
        and(
          eq(recruiterAvailability.recruiterId, recruiterId),
          eq(recruiterAvailability.recruitmentId, recruitmentId),
          lt(recruiterAvailability.start, slotEnd),
          sql`${recruiterAvailability.start} + make_interval(mins => ${recruiterAvailability.duration}) > ${sql.param(slotStart, recruiterAvailability.start)}`,
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
          eq(interview.recruitmentId, recruitmentId),
          lt(slot.start, slotEnd),
          sql`${slot.start} + make_interval(mins => ${slot.duration}) > ${sql.param(slotStart, slot.start)}`,
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
          eq(dynamic.recruitmentId, recruitmentId),
          lt(slot.start, slotEnd),
          sql`${slot.start} + make_interval(mins => ${slot.duration}) > ${sql.param(slotStart, slot.start)}`,
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
