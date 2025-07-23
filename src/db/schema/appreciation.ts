import { pgTable, serial, integer, check, text } from "drizzle-orm/pg-core";
import { application } from "./application";
import { recruiter } from "./user_roles";
import { relations, sql } from "drizzle-orm";

export const appreciation = pgTable(
  "appreciation",
  {
    id: serial("id").primaryKey(),
    grade: integer("grade").notNull(),
    applicationId: integer("application_id")
      .notNull()
      .references(() => application.id, { onDelete: "cascade" }),
    recruiterId: text("recruiter_id")
      .notNull()
      .references(() => recruiter.userId, { onDelete: "cascade" }),
  },
  (table) => [
    check("grade_range", sql`${table.grade} >= 0 AND ${table.grade} <= 3`),
  ],
);

export const appreciationRelations = relations(appreciation, ({ one }) => ({
  application: one(application, {
    fields: [appreciation.applicationId],
    references: [application.id],
  }),
  recruiter: one(recruiter, {
    fields: [appreciation.recruiterId],
    references: [recruiter.userId],
  }),
}));
