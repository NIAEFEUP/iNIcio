import {
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { relations } from "drizzle-orm";
import { recruitmentPhaseStatus } from "./recruitment_phase";
import { application } from "./application";
import { recruitment, usersToRecruitments } from "./recruitment";
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

export const candidate = pgTable(
  "candidate",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recruitmentId: integer("recruitment_id")
      .notNull()
      .references(() => recruitment.id, { onDelete: "cascade" }),
    interviewClassification: text("interview_classification").default("none"),
    dynamicClassification: text("dynamic_classification").default("none"),
  },
  (table) => [primaryKey({ columns: [table.userId, table.recruitmentId] })],
);

export const userRelations = relations(user, ({ one, many }) => ({
  recruiter: one(recruiter, {
    fields: [user.id],
    references: [recruiter.userId],
  }),
  candidates: many(candidate),
  admin: one(admin, {
    fields: [user.id],
    references: [admin.userId],
  }),
  recruitmentPhaseStatuses: many(recruitmentPhaseStatus),
  userToRecruitment: many(usersToRecruitments),
}));

export const recruiterToCandidate = pgTable(
  "recruiter_to_candidate",
  {
    recruiterId: text("recruiter_id")
      .notNull()
      .references(() => recruiter.userId, { onDelete: "cascade" }),
    candidateId: text("candidate_id").notNull(),
    recruitmentId: integer("recruitment_id")
      .notNull()
      .references(() => recruitment.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.recruiterId, table.candidateId, table.recruitmentId],
    }),
    foreignKey({
      columns: [table.candidateId, table.recruitmentId],
      foreignColumns: [candidate.userId, candidate.recruitmentId],
      name: "recruiter_to_candidate_candidate_fk",
    }).onDelete("cascade"),
  ],
);

export const recruiterToCandidateRelations = relations(
  recruiterToCandidate,
  ({ one }) => ({
    recruiter: one(user, {
      fields: [recruiterToCandidate.recruiterId],
      references: [user.id],
    }),
    candidateUser: one(user, {
      fields: [recruiterToCandidate.candidateId],
      references: [user.id],
    }),
    recruitment: one(recruitment, {
      fields: [recruiterToCandidate.recruitmentId],
      references: [recruitment.id],
    }),
    candidate: one(candidate, {
      fields: [
        recruiterToCandidate.candidateId,
        recruiterToCandidate.recruitmentId,
      ],
      references: [candidate.userId, candidate.recruitmentId],
      relationName: "candidate_knownRecruiters",
    }),
    recruiterRef: one(recruiter, {
      fields: [recruiterToCandidate.recruiterId],
      references: [recruiter.userId],
      relationName: "recruiter_knownCandidates",
    }),
  }),
);

export const recruiterRelations = relations(recruiter, ({ one, many }) => ({
  user: one(user, {
    fields: [recruiter.userId],
    references: [user.id],
  }),
  knownCandidates: many(recruiterToCandidate, {
    relationName: "recruiter_knownCandidates",
  }),
  appreciations: many(appreciation),
  interviews: many(recruiterToInterview),
  dynamics: many(recruiterToDynamic),
}));

export const candidateRelations = relations(candidate, ({ many, one }) => ({
  user: one(user, {
    fields: [candidate.userId],
    references: [user.id],
  }),
  recruitment: one(recruitment, {
    fields: [candidate.recruitmentId],
    references: [recruitment.id],
  }),
  application: one(application, {
    fields: [candidate.userId, candidate.recruitmentId],
    references: [application.candidateId, application.recruitmentId],
  }),
  interview: one(interview, {
    fields: [candidate.userId, candidate.recruitmentId],
    references: [interview.candidateId, interview.recruitmentId],
  }),
  dynamic: one(candidateToDynamic, {
    fields: [candidate.userId, candidate.recruitmentId],
    references: [
      candidateToDynamic.candidateId,
      candidateToDynamic.recruitmentId,
    ],
  }),
  knownRecruiters: many(recruiterToCandidate, {
    relationName: "candidate_knownRecruiters",
  }),
}));
