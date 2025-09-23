import { pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { relations } from "drizzle-orm";
import { recruitmentPhaseStatus } from "./recruitment_phase";
import { application } from "./application";
import { usersToRecruitments } from "./recruitment";
import { interview, recruiterToInterview } from "./interview";
import { candidateToDynamic, recruiterToDynamic } from "./dynamic";
import { appreciation } from "./appreciation";

export const admin = pgTable("admin", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id),
});

export const recruiter = pgTable("recruiter", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id),
});

export const candidate = pgTable("candidate", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id),
});

export const userRelations = relations(user, ({ one, many }) => ({
  recruiter: one(recruiter, {
    fields: [user.id],
    references: [recruiter.userId],
  }),
  candidate: one(candidate, {
    fields: [user.id],
    references: [candidate.userId],
  }),
  admin: one(admin, {
    fields: [user.id],
    references: [admin.userId],
  }),
  recruitmentPhaseStatuses: many(recruitmentPhaseStatus),
  userToRecruitment: many(usersToRecruitments),
}));

export const recruiterToCandidate = pgTable("recruiter_to_candidate", {
  recruiterId: text("recruiter_id")
    .notNull()
    .references(() => recruiter.userId),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidate.userId),
});

export const recruiterToCandidateRelations = relations(
  recruiterToCandidate,
  ({ one }) => ({
    recruiter: one(recruiter, {
      fields: [recruiterToCandidate.recruiterId],
      references: [recruiter.userId],
    }),
    candidate: one(candidate, {
      fields: [recruiterToCandidate.candidateId],
      references: [candidate.userId],
    }),
  }),
);

export const recruiterRelations = relations(recruiter, ({ many }) => ({
  knownCandidates: many(recruiterToCandidate),
  appreciations: many(appreciation),
  interviews: many(recruiterToInterview),
  dynamics: many(recruiterToDynamic),
}));

export const candidateRelations = relations(candidate, ({ many, one }) => ({
  knownRecruiters: many(recruiterToCandidate),
  user: one(user, {
    fields: [candidate.userId],
    references: [user.id],
  }),
  application: one(application, {
    fields: [candidate.userId],
    references: [application.candidateId],
  }),
  interview: one(interview, {
    fields: [candidate.userId],
    references: [interview.candidateId],
  }),
  dynamics: many(candidateToDynamic),
}));
