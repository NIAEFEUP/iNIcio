import {
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
  jsonb,
  boolean,
  unique,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { candidate, recruiter } from "./user_roles";
import { relations } from "drizzle-orm";
import { interviewComment } from "./comment";
import { slot } from "./recruitment_phase";
import { recruitment } from "./recruitment";

export const interview = pgTable(
  "interview",
  {
    id: serial("id").primaryKey(),
    recruitmentId: integer("recruitment_id")
      .notNull()
      .references(() => recruitment.id, { onDelete: "cascade" }),
    content: jsonb("content").notNull().default([]),
    candidateId: text("candidate_id").notNull(),
    slot: integer("slot").notNull(),
    locked: boolean("locked").notNull().default(false),
  },
  (table) => [
    unique("interview_candidate_recruitment_unique").on(
      table.candidateId,
      table.recruitmentId,
    ),
    index("interview_recruitment_id_idx").on(table.recruitmentId),
    index("interview_slot_idx").on(table.slot),
    foreignKey({
      columns: [table.candidateId, table.recruitmentId],
      foreignColumns: [candidate.userId, candidate.recruitmentId],
      name: "interview_candidate_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.slot, table.recruitmentId],
      foreignColumns: [slot.id, slot.recruitmentId],
      name: "interview_slot_fk",
    }),
  ],
);

export const recruiterToInterview = pgTable(
  "recruiter_to_interview",
  {
    recruiterId: text("recruiter_id")
      .notNull()
      .references(() => recruiter.userId, { onDelete: "cascade" }),
    interviewId: integer("interview_id")
      .notNull()
      .references(() => interview.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.recruiterId, table.interviewId] })],
);

export const interviewRelations = relations(interview, ({ one, many }) => ({
  candidate: one(candidate, {
    fields: [interview.candidateId, interview.recruitmentId],
    references: [candidate.userId, candidate.recruitmentId],
  }),
  recruitment: one(recruitment, {
    fields: [interview.recruitmentId],
    references: [recruitment.id],
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

export const interviewTemplate = pgTable("interview_template", {
  id: serial("id").primaryKey(),
  content: jsonb("content").notNull().default([]),
});
