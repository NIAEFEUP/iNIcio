import { relations, sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { recruitment } from "./recruitment";
import { user } from "./auth";

export const slot = pgTable("slot", {
  id: serial("id").primaryKey(),
  start: timestamp("start").notNull(),
  duration: integer("duration").notNull(),
  quantity: integer("quantity").notNull().default(1),
  type: text("type", {
    enum: ["interview", "dynamic", "interview-dynamic"],
  }).default("interview-dynamic"),
  recruitmentYear: integer("recruitment_year")
    .notNull()
    .references(() => recruitment.year),
});

export const recruiterAvailability = pgTable("recruiter_availability", {
  id: serial("id").primaryKey(),
  start: timestamp("start").notNull(),
  duration: integer("duration").notNull(),
  recruiterId: text("recruiter_id")
    .notNull()
    .references(() => user.id),
  recruitmentYear: integer("recruitment_year")
    .notNull()
    .references(() => recruitment.year),
});

export const recruiterAvailabilityRelations = relations(
  recruiterAvailability,
  ({ one }) => ({
    recruiter: one(user, {
      fields: [recruiterAvailability.recruiterId],
      references: [user.id],
    }),
    recruitment: one(recruitment, {
      fields: [recruiterAvailability.recruitmentYear],
      references: [recruitment.year],
    }),
  }),
);

export const recruitmentPhase = pgTable(
  "recruitment_phase",
  {
    id: serial("id").primaryKey(),
    recruitmentYear: integer("recruitment_year")
      .notNull()
      .references(() => recruitment.year),
    role: text("role", { enum: ["recruiter", "candidate"] }).notNull(),
    start: timestamp("start"),
    end: timestamp("end"),
    title: text("title").notNull(),
    clientIdentifier: text("client_identifier").notNull().default(""),
    description: text("description").notNull(),
  },
  (table) => [check("start_before_end", sql`${table.start} < ${table.end}`)],
);

export const recruitmentPhaseRelations = relations(
  recruitmentPhase,
  ({ one, many }) => ({
    recruitment: one(recruitment, {
      fields: [recruitmentPhase.recruitmentYear],
      references: [recruitment.year],
    }),
    statuses: many(recruitmentPhaseStatus),
  }),
);

export const recruitmentPhaseStatus = pgTable(
  "recruitment_phase_status",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    phaseId: integer("phase_id")
      .notNull()
      .references(() => recruitmentPhase.id),
    status: text("status", {
      enum: ["blocked", "todo", "done"],
    }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.phaseId] })],
);

export const recruitmentPhaseStatusRelations = relations(
  recruitmentPhaseStatus,
  ({ one }) => ({
    user: one(user, {
      fields: [recruitmentPhaseStatus.userId],
      references: [user.id],
    }),
    phase: one(recruitmentPhase, {
      fields: [recruitmentPhaseStatus.phaseId],
      references: [recruitmentPhase.id],
    }),
  }),
);
