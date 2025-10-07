import { recruiter, recruiterAvailability } from "@/db/schema";
import { db, RecruiterAvailability } from "./db";
import { and, eq } from "drizzle-orm";
import { isAdmin } from "./admin";

export async function isRecruiter(id: string) {
  if (!id) return false;

  return (
    (await db.query.recruiter.findFirst({
      where: eq(recruiter.userId, id),
    })) || (await isAdmin(id))
  );
}

export async function getRecruiters() {
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
        eq(recruiterAvailability.recruitmentYear, availablity.recruitmentYear),
      ),
    );
}

export async function getAvailabilities(recruiterId: string) {
  return await db.query.recruiterAvailability.findMany({
    where: eq(recruiterAvailability.recruiterId, recruiterId),
  });
}

export async function getAllRecruiterAvailabilities() {
  return await db.query.recruiterAvailability.findMany({
    with: {
      recruiter: {
        with: {
          recruiter: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  });
}

export async function getAllRecruiters() {
  return await db.query.recruiter.findMany({
    with: {
      user: true,
    },
  });
}
