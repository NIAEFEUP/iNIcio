import { recruiterAvailability, usersToRecruitments } from "@/db/schema";
import { db, RecruiterAvailability } from "./db";
import { and, eq } from "drizzle-orm";
import { isAdmin } from "./admin";
import { getActiveRecruitment } from "./recruitment";

export async function isRecruiter(id: string, recruitmentId?: number) {
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
}

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

export async function addAvailability(availablity: RecruiterAvailability) {
  return await db.insert(recruiterAvailability).values({
    ...availablity,
  });
}

export async function removeAvailability(availablity: RecruiterAvailability) {
  return await db
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
