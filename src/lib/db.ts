import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

export type Application = typeof schema.application.$inferSelect;
export type CandidateToDynamic = typeof schema.candidateToDynamic.$inferSelect;
export type Dynamic = typeof schema.dynamic.$inferSelect;
export type RecruitmentPhase = typeof schema.recruitmentPhase.$inferSelect;
export type Slot = typeof schema.slot.$inferSelect;
export type Candidate = typeof schema.candidate.$inferSelect;
export type Recruiter = typeof schema.recruiter.$inferSelect;
export type RecruiterToCandidate =
  typeof schema.recruiterToCandidate.$inferSelect;
export type User = typeof schema.user.$inferSelect;
export type ApplicationComment = typeof schema.applicationComment.$inferSelect;

export const db = drizzle(process.env.DATABASE_URL!, { schema });

export const getAllCandidateUsers = async () => {
  return await db
    .select()
    .from(schema.candidate)
    .innerJoin(schema.user, eq(schema.candidate.userId, schema.user.id))
    .then((res) => res.map((row) => row.user));
};

export const getUser = async (id: string) => {
  return await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, id))
    .then((res) => res[0]);
};

export const getRecruitmentCandidatePhases = async () => {
  return await db
    .select()
    .from(schema.recruitmentPhase)
    .where(eq(schema.recruitmentPhase.role, "candidate"))
    .then((res) => res);
};
