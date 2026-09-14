import {
  timestamp,
  integer,
  pgTable,
  serial,
  text,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { recruitment } from "./recruitment";
import { user } from "./auth";
import { candidate } from "./user_roles";
import { relations } from "drizzle-orm";

export const votingPhase = pgTable("voting_phase", {
  id: serial("id").primaryKey(),
  recruitmentId: integer("recruitment_id")
    .notNull()
    .references(() => recruitment.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow(),
});

export const votingPhaseCandidate = pgTable(
  "voting_phase_candidate",
  {
    votingPhaseId: integer("voting_phase_id")
      .notNull()
      .references(() => votingPhase.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    voteFinished: boolean("vote_finished").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.votingPhaseId, table.candidateId] }),
  ],
);

export const votingPhaseStatus = pgTable("voting_phase_status", {
  votingPhaseId: integer("voting_phase_id")
    .notNull()
    .references(() => votingPhase.id, { onDelete: "cascade" }),
  candidateId: text("candidate_id").references(() => user.id),
  accepted_candidates: integer("accepted_candidates").notNull().default(0),
  rejected_candidates: integer("rejected_candidates").notNull().default(0),
});

export const votingPhaseRelations = relations(votingPhase, ({ one, many }) => ({
  recruitment: one(recruitment, {
    fields: [votingPhase.recruitmentId],
    references: [recruitment.id],
  }),
  candidates: many(votingPhaseCandidate),
  status: one(votingPhaseStatus, {
    fields: [votingPhase.id],
    references: [votingPhaseStatus.votingPhaseId],
  }),
}));

export const votingPhaseCandidateRelations = relations(
  votingPhaseCandidate,
  ({ one }) => ({
    user: one(user, {
      fields: [votingPhaseCandidate.candidateId],
      references: [user.id],
    }),
    votingPhase: one(votingPhase, {
      fields: [votingPhaseCandidate.votingPhaseId],
      references: [votingPhase.id],
    }),
  }),
);

export const candidateVote = pgTable("candidate_vote", {
  votingPhaseId: integer("voting_phase_id")
    .notNull()
    .references(() => votingPhase.id, { onDelete: "cascade" }),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  decision: text("decision", { enum: ["approve", "reject"] })
    .notNull()
    .default("approve"),
});

// Registers if recruiter voted for a candidate
// but it does not store the value of the vote itself
// This perserves anonymity
export const recruiterVote = pgTable("recruiter_vote", {
  votingPhaseId: integer("voting_phase_id")
    .notNull()
    .references(() => votingPhase.id, { onDelete: "cascade" }),
  recruiterId: text("recruiter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
