import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, jsonb } from "drizzle-orm/pg-core";
import { candidate, recruiter } from "./user_roles";
import { dynamicComment } from "./comment";
import { slot } from "./recruitment_phase";

export const dynamic = pgTable("dynamic", {
  id: serial("id").primaryKey(),
  content: jsonb("content"),
  slot: integer("slot_id")
    .notNull()
    .references(() => slot.id),
});

export const candidateToDynamic = pgTable("candidate_to_dynamic", {
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidate.userId, { onDelete: "cascade" }),
  dynamicId: integer("dynamic_id")
    .notNull()
    .references(() => dynamic.id, { onDelete: "cascade" }),
});

export const recruiterToDynamic = pgTable("recruiter_to_dynamic", {
  recruiterId: text("recruiter_id")
    .notNull()
    .references(() => recruiter.userId, { onDelete: "cascade" }),
  dynamicId: integer("dynamic_id")
    .notNull()
    .references(() => dynamic.id, { onDelete: "cascade" }),
});

export const dynamicRelations = relations(dynamic, ({ many, one }) => ({
  candidates: many(candidateToDynamic),
  recruiters: many(recruiterToDynamic),
  comments: many(dynamicComment),
  slot: one(slot, {
    fields: [dynamic.slot],
    references: [slot.id],
  }),
}));

export const candidateToDynamicRelations = relations(
  candidateToDynamic,
  ({ one }) => ({
    candidate: one(candidate, {
      fields: [candidateToDynamic.candidateId],
      references: [candidate.userId],
    }),
    dynamic: one(dynamic, {
      fields: [candidateToDynamic.dynamicId],
      references: [dynamic.id],
    }),
  }),
);

export const recruiterToDynamicRelations = relations(
  recruiterToDynamic,
  ({ one }) => ({
    recruiter: one(recruiter, {
      fields: [recruiterToDynamic.recruiterId],
      references: [recruiter.userId],
    }),
    dynamic: one(dynamic, {
      fields: [recruiterToDynamic.dynamicId],
      references: [dynamic.id],
    }),
  }),
);

export const dynamicTemplate = pgTable("dynamic_template", {
  id: serial("id").primaryKey(),
  content: jsonb("content").notNull().default([]),
});
