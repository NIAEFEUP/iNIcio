import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { recruitment } from "./recruitment";
import { user } from "@/drizzle/schema";
import { relations } from "drizzle-orm";

export const votingPhase = pgTable("voting_phase", {
  id: serial("id").primaryKey(),
  recruitmentYear: integer("recruitment_year")
    .notNull()
    .references(() => recruitment.year),
});

export const votingPhaseCandidate = pgTable("voting_phase_candidate", {
  votingPhaseId: integer("voting_phase_id")
    .notNull()
    .references(() => votingPhase.id),
  candidateId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const votingPhaseStatus = pgTable("voting_phase_status", {
  votingPhaseId: integer("voting_phase_id")
    .notNull()
    .references(() => votingPhase.id),
  candidateId: text("candidate_id").references(() => user.id),
  accepted_candidates: integer("accepted_candidates").notNull().default(0),
  rejected_candidates: integer("rejected_candidates").notNull().default(0),
});

export const votingPhaseRelations = relations(votingPhase, ({ one, many }) => ({
  recruitment: one(recruitment, {
    fields: [votingPhase.recruitmentYear],
    references: [recruitment.year],
  }),
  candidates: many(votingPhaseCandidate),
  status: one(votingPhaseStatus, {
    fields: [votingPhase.id],
    references: [votingPhaseStatus.votingPhaseId],
  }),
}));

export const candidateVote = pgTable("candidate_vote", {
  votingPhaseId: integer("voting_phase_id")
    .notNull()
    .references(() => votingPhase.id),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => user.id),
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
    .references(() => votingPhase.id),
  recruiterId: text("recruiter_id")
    .notNull()
    .references(() => user.id),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => user.id),
});
