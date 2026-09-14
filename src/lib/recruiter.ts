import {
  recruiter,
  recruiterAvailability,
  usersToRecruitments,
} from "@/db/schema";
import { db, RecruiterAvailability } from "./db";
import { and, eq } from "drizzle-orm";
import { isAdmin } from "./admin";
import { getActiveRecruitment } from "./recruitment";

export async function isRecruiter(id: string, recruitmentId?: number) {
  if (!id) return false;

  if (await isAdmin(id)) return true;

  if (recruitmentId) {
    const enrolled = await db.query.usersToRecruitments.findFirst({
      where: and(
        eq(usersToRecruitments.userId, id),
        eq(usersToRecruitments.recruitmentId, recruitmentId),
      ),
    });
    if (enrolled) return true;
  }

  const isPlatformRecruiter = await db.query.recruiter.findFirst({
    where: eq(recruiter.userId, id),
  });

  return isPlatformRecruiter !== null && isPlatformRecruiter !== undefined;
}

export async function getRecruiters(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  if (targetId) {
    const enrolled = await db.query.usersToRecruitments.findMany({
      where: eq(usersToRecruitments.recruitmentId, targetId),
      with: {
        user: true,
      },
    });

    if (enrolled.length > 0) {
      return enrolled.map((e) => e.user);
    }
  }

  return await db.query.user.findMany({
    where: (user, { exists }) =>
      exists(db.select().from(recruiter).where(eq(recruiter.userId, user.id))),
  });
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
  const conditions = [eq(recruiterAvailability.recruiterId, recruiterId)];
  if (recruitmentId) {
    conditions.push(eq(recruiterAvailability.recruitmentId, recruitmentId));
  }

  return await db.query.recruiterAvailability.findMany({
    where: and(...conditions),
  });
}

export async function getAllRecruiterAvailabilities(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  return await db.query.recruiterAvailability.findMany({
    where: targetId
      ? eq(recruiterAvailability.recruitmentId, targetId)
      : undefined,
    with: {
      recruiter: true,
    },
  });
}

export async function getAllRecruiters(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  if (targetId) {
    const enrolled = await db.query.usersToRecruitments.findMany({
      where: eq(usersToRecruitments.recruitmentId, targetId),
      with: {
        user: true,
      },
    });

    if (enrolled.length > 0) {
      return enrolled.map((e) => ({
        userId: e.userId,
        user: e.user,
      }));
    }
  }

  return await db.query.recruiter.findMany({
    with: {
      user: true,
    },
  });
}
