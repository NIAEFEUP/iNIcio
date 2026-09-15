import { relations } from "drizzle-orm";
import {
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
  jsonb,
  primaryKey,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { candidate, recruiter } from "./user_roles";
import { dynamicComment } from "./comment";
import { slot } from "./recruitment_phase";
import { recruitment } from "./recruitment";

export const dynamic = pgTable(
  "dynamic",
  {
    id: serial("id").primaryKey(),
    recruitmentId: integer("recruitment_id")
      .notNull()
      .references(() => recruitment.id, { onDelete: "cascade" }),
    content: jsonb("content"),
    slot: integer("slot_id")
      .notNull()
      .references(() => slot.id),
  },
  (table) => [
    unique("dynamic_id_recruitment_unique").on(table.id, table.recruitmentId),
    index("dynamic_recruitment_id_idx").on(table.recruitmentId),
    index("dynamic_slot_idx").on(table.slot),
  ],
);

export const candidateToDynamic = pgTable(
  "candidate_to_dynamic",
  {
    candidateId: text("candidate_id").notNull(),
    dynamicId: integer("dynamic_id")
      .notNull()
      .references(() => dynamic.id, { onDelete: "cascade" }),
    recruitmentId: integer("recruitment_id")
      .notNull()
      .references(() => recruitment.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.candidateId, table.dynamicId] }),
    unique("candidate_dynamic_recruitment_unique").on(
      table.candidateId,
      table.recruitmentId,
    ),
    foreignKey({
      columns: [table.candidateId, table.recruitmentId],
      foreignColumns: [candidate.userId, candidate.recruitmentId],
      name: "candidate_to_dynamic_candidate_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.dynamicId, table.recruitmentId],
      foreignColumns: [dynamic.id, dynamic.recruitmentId],
      name: "candidate_to_dynamic_dynamic_fk",
    }).onDelete("cascade"),
  ],
);

export const recruiterToDynamic = pgTable(
  "recruiter_to_dynamic",
  {
    recruiterId: text("recruiter_id")
      .notNull()
      .references(() => recruiter.userId, { onDelete: "cascade" }),
    dynamicId: integer("dynamic_id")
      .notNull()
      .references(() => dynamic.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.recruiterId, table.dynamicId] })],
);

export const dynamicRelations = relations(dynamic, ({ many, one }) => ({
  candidates: many(candidateToDynamic),
  recruiters: many(recruiterToDynamic),
  comments: many(dynamicComment),
  recruitment: one(recruitment, {
    fields: [dynamic.recruitmentId],
    references: [recruitment.id],
  }),
  slot: one(slot, {
    fields: [dynamic.slot],
    references: [slot.id],
  }),
}));

export const candidateToDynamicRelations = relations(
  candidateToDynamic,
  ({ one }) => ({
    candidate: one(candidate, {
      fields: [
        candidateToDynamic.candidateId,
        candidateToDynamic.recruitmentId,
      ],
      references: [candidate.userId, candidate.recruitmentId],
    }),
    dynamic: one(dynamic, {
      fields: [candidateToDynamic.dynamicId, candidateToDynamic.recruitmentId],
      references: [dynamic.id, dynamic.recruitmentId],
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
