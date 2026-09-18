import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { recruitmentPhase } from "./recruitment_phase";

export const recruitment = pgTable(
  "recruitment",
  {
    id: serial("id").primaryKey(),
    lectiveYear: text("lective_year").notNull(),
    semester: integer("semester").notNull().default(1),
    title: text("title").notNull().default("Recrutamento 1º Semestre"),
    start: timestamp("start").notNull().defaultNow(),
    end: timestamp("end").notNull(),
    active: text("active").notNull().default("true"),
  },
  (table) => [
    unique("recruitment_lective_year_semester_unique").on(
      table.lectiveYear,
      table.semester,
    ),
    index("recruitment_lective_year_idx").on(table.lectiveYear),
  ],
);

export const usersToRecruitments = pgTable(
  "users_to_recruitments",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recruitmentId: integer("recruitment_id")
      .notNull()
      .references(() => recruitment.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.recruitmentId] })],
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
      fields: [usersToRecruitments.recruitmentId],
      references: [recruitment.id],
    }),
  }),
);
