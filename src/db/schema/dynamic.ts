import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { candidate, recruiter } from "./user_roles";
import { dynamicComment } from "./comment";

export const dynamic = pgTable("dynamic", {
  id: serial("id").primaryKey(),
  datetime: timestamp("datetime").notNull().defaultNow(),
  content: text("content").notNull(),
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

export const dynamicRelations = relations(dynamic, ({ many }) => ({
  candidate: many(candidateToDynamic),
  recruiters: many(recruiterToDynamic),
  comments: many(dynamicComment),
}));

export const candidateToDynamicRelations = relations(
  candidateToDynamic,
  ({ one }) => ({
    candidate: one(dynamic, {
      fields: [candidateToDynamic.candidateId],
      references: [dynamic.id],
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
