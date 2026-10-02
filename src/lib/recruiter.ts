import {
  dynamic,
  interview,
  recruiterAvailability,
  recruiterToDynamic,
  recruiterToInterview,
  usersToRecruitments,
} from "@/db/schema";
import { db, NewRecruiterAvailability } from "./db";
import { and, eq, sql } from "drizzle-orm";
import { isAdmin } from "./admin";
import { getActiveRecruitment } from "./recruitment";
import { cache } from "react";

type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export const isRecruiter = cache(async (id: string, recruitmentId?: number) => {
  if (!id) return false;

  if (await isAdmin(id)) return true;

  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return false;

  const enrolled = await db.query.usersToRecruitments.findFirst({
    where: and(
      eq(usersToRecruitments.userId, id),
      eq(usersToRecruitments.recruitmentId, targetId),
    ),
  });

  return enrolled !== null && enrolled !== undefined;
});

export async function getRecruiters(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  const enrolled = await db.query.usersToRecruitments.findMany({
    where: eq(usersToRecruitments.recruitmentId, targetId),
    with: {
      user: true,
    },
  });

  return enrolled.map((e) => e.user);
}

export async function addAvailability(
  availablity: NewRecruiterAvailability,
  client: DbClient = db,
) {
  return await client
    .insert(recruiterAvailability)
    .values({ ...availablity })
    .onConflictDoNothing();
}

export async function removeAvailability(
  availablity: NewRecruiterAvailability,
  client: DbClient = db,
) {
  return await client
    .delete(recruiterAvailability)
    .where(
      and(
        eq(recruiterAvailability.start, availablity.start),
        eq(recruiterAvailability.duration, availablity.duration),
        eq(recruiterAvailability.recruiterId, availablity.recruiterId),
        eq(recruiterAvailability.recruitmentId, availablity.recruitmentId),
      ),
    );
}

export async function getAvailabilities(
  recruiterId: string,
  recruitmentId?: number,
) {
  if (!recruitmentId) return [];

  return await db.query.recruiterAvailability.findMany({
    where: and(
      eq(recruiterAvailability.recruiterId, recruiterId),
      eq(recruiterAvailability.recruitmentId, recruitmentId),
    ),
  });
}

export async function getAllRecruiterAvailabilities(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  return await db.query.recruiterAvailability.findMany({
    where: eq(recruiterAvailability.recruitmentId, targetId),
    with: {
      recruiter: true,
    },
  });
}

export interface RecruiterStats {
  /** Total minutes of declared availability. */
  availabilityMinutes: number;
  /** Number of declared availability blocks. */
  availabilitySlots: number;
  /** Number of interviews the recruiter is assigned to. */
  interviews: number;
  /** Number of dynamic sessions the recruiter is assigned to. */
  dynamics: number;
}

/**
 * Per-recruiter aggregates for a recruitment: declared availability and how
 * many interviews/dynamics each recruiter is assigned to.
 */
export async function getRecruiterStats(
  recruitmentId?: number,
): Promise<Map<string, RecruiterStats>> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  const stats = new Map<string, RecruiterStats>();
  if (!targetId) return stats;

  const [availability, interviews, dynamics] = await Promise.all([
    db
      .select({
        recruiterId: recruiterAvailability.recruiterId,
        minutes:
          sql<number>`coalesce(sum(${recruiterAvailability.duration}), 0)`.mapWith(
            Number,
          ),
        slots: sql<number>`count(*)`.mapWith(Number),
      })
      .from(recruiterAvailability)
      .where(eq(recruiterAvailability.recruitmentId, targetId))
      .groupBy(recruiterAvailability.recruiterId),
    db
      .select({
        recruiterId: recruiterToInterview.recruiterId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(recruiterToInterview)
      .innerJoin(interview, eq(interview.id, recruiterToInterview.interviewId))
      .where(eq(interview.recruitmentId, targetId))
      .groupBy(recruiterToInterview.recruiterId),
    db
      .select({
        recruiterId: recruiterToDynamic.recruiterId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(recruiterToDynamic)
      .innerJoin(dynamic, eq(dynamic.id, recruiterToDynamic.dynamicId))
      .where(eq(dynamic.recruitmentId, targetId))
      .groupBy(recruiterToDynamic.recruiterId),
  ]);

  const ensure = (recruiterId: string) => {
    let entry = stats.get(recruiterId);
    if (!entry) {
      entry = {
        availabilityMinutes: 0,
        availabilitySlots: 0,
        interviews: 0,
        dynamics: 0,
      };
      stats.set(recruiterId, entry);
    }
    return entry;
  };

  for (const row of availability) {
    const entry = ensure(row.recruiterId);
    entry.availabilityMinutes = row.minutes;
    entry.availabilitySlots = row.slots;
  }
  for (const row of interviews) ensure(row.recruiterId).interviews = row.count;
  for (const row of dynamics) ensure(row.recruiterId).dynamics = row.count;

  return stats;
}

export async function getAllRecruiters(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  const enrolled = await db.query.usersToRecruitments.findMany({
    where: eq(usersToRecruitments.recruitmentId, targetId),
    with: {
      user: true,
    },
  });

  return enrolled.map((e) => ({
    userId: e.userId,
    user: e.user,
  }));
}
