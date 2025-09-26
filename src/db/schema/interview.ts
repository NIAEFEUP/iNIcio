import { integer, pgTable, serial, text, jsonb } from "drizzle-orm/pg-core";
import { candidate, recruiter } from "./user_roles";
import { relations } from "drizzle-orm";
import { interviewComment } from "./comment";
import { slot } from "./recruitment_phase";

export const interview = pgTable("interview", {
  id: serial("id").primaryKey(),
  content: jsonb("content").notNull().default([]),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidate.userId, { onDelete: "cascade" }),
  slot: integer("slot")
    .notNull()
    .references(() => slot.id),
});

export const recruiterToInterview = pgTable("recruiter_to_interview", {
  recruiterId: text("recruiter_id")
    .notNull()
    .references(() => recruiter.userId, { onDelete: "cascade" }),
  interviewId: integer("interview_id")
    .notNull()
    .references(() => interview.id, { onDelete: "cascade" }),
});

export const interviewRelations = relations(interview, ({ one, many }) => ({
  candidate: one(candidate, {
    fields: [interview.candidateId],
    references: [candidate.userId],
  }),
  recruiters: many(recruiterToInterview),
  comments: many(interviewComment),
  slot: one(slot, {
    fields: [interview.slot],
    references: [slot.id],
  }),
}));

export const recruiterToInterviewRelations = relations(
  recruiterToInterview,
  ({ one }) => ({
    recruiter: one(recruiter, {
      fields: [recruiterToInterview.recruiterId],
      references: [recruiter.userId],
    }),
    interview: one(interview, {
      fields: [recruiterToInterview.interviewId],
      references: [interview.id],
    }),
  }),
);
