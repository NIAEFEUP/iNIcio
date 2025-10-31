import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

export type Recruitment = typeof schema.recruitment.$inferSelect;
export type Interview = typeof schema.interview.$inferSelect;
export type RecruiterAvailability =
  typeof schema.recruiterAvailability.$inferSelect;
export type NewRecruiterAvailability =
  typeof schema.recruiterAvailability.$inferInsert;
export type Application = typeof schema.application.$inferSelect;
export type CandidateToDynamic = typeof schema.candidateToDynamic.$inferSelect;
export type Dynamic = typeof schema.dynamic.$inferSelect;
export type RecruitmentPhase = typeof schema.recruitmentPhase.$inferSelect;
export type Slot = typeof schema.slot.$inferSelect;
export type NewSlot = typeof schema.slot.$inferInsert;
export type Candidate = typeof schema.candidate.$inferSelect;
export type Recruiter = typeof schema.recruiter.$inferSelect;
export type RecruiterToCandidate =
  typeof schema.recruiterToCandidate.$inferSelect;
export type User = typeof schema.user.$inferSelect;
export type NewUser = typeof schema.user.$inferInsert;
export type NewApplicationComment =
  typeof schema.applicationComment.$inferInsert;
export type ApplicationComment = typeof schema.applicationComment.$inferSelect;
export type Notification = typeof schema.notification.$inferSelect;
export type InterviewTemplate = typeof schema.interviewTemplate.$inferSelect;
export type DynamicTemplate = typeof schema.dynamicTemplate.$inferSelect;
export type InterviewComment = typeof schema.interviewComment.$inferSelect;
export type DynamicComment = typeof schema.dynamicComment.$inferSelect;
export type NewInterviewComment = typeof schema.interviewComment.$inferInsert;
export type NewDynamicComment = typeof schema.dynamicComment.$inferInsert;
export type VotingPhaseStatus = typeof schema.votingPhaseStatus.$inferSelect;
export type VotingPhase = typeof schema.votingPhase.$inferSelect & {
  status: VotingPhaseStatus;
};
export type CandidateVote = typeof schema.candidateVote.$inferSelect;
export type RecruiterVote = typeof schema.recruiterVote.$inferSelect;
export type FinalMessageTemplate =
  typeof schema.finalMessageTemplate.$inferSelect;

const pool =
  globalThis.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 100,
  });

export const db = drizzle(pool, { schema });

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
