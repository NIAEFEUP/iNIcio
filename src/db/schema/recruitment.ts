import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { recruitmentPhase } from "./recruitment_phase";

export const recruitment = pgTable("recruitment", {
  year: integer("year").primaryKey(),
});

export const usersToRecruitments = pgTable(
  "users_to_recruitments",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    recruitmentYear: integer("recruitment_year")
      .notNull()
      .references(() => recruitment.year),
  },
  (table) => [primaryKey({ columns: [table.userId, table.recruitmentYear] })],
);

export const recruitmentRelations = relations(recruitment, ({ many }) => ({
  userToRecruitment: many(usersToRecruitments),
  phases: many(recruitmentPhase),
}));

export const usersToRecruitmentsRelations = relations(
  usersToRecruitments,
  ({ one }) => ({
    user: one(user, {
      fields: [usersToRecruitments.userId],
      references: [user.id],
    }),
    recruitment: one(recruitment, {
      fields: [usersToRecruitments.recruitmentYear],
      references: [recruitment.year],
    }),
  }),
);
