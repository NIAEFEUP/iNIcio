import { relations, sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { recruitment } from "./recruitment";
import { user } from "./auth";

export const slot = pgTable(
  "slot",
  {
    id: serial("id").primaryKey(),
    start: timestamp("start").notNull(),
    duration: integer("duration").notNull(),
    quantity: integer("quantity").notNull().default(1),
    type: text("type", {
      enum: ["interview", "dynamic"],
    }).default("interview"),
    recruitmentId: integer("recruitment_id")
      .notNull()
      .references(() => recruitment.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("slot_id_recruitment_unique").on(table.id, table.recruitmentId),
  ],
);

export const recruiterAvailability = pgTable("recruiter_availability", {
  id: serial("id").primaryKey(),
  start: timestamp("start").notNull(),
  duration: integer("duration").notNull(),
  recruiterId: text("recruiter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  recruitmentId: integer("recruitment_id")
    .notNull()
    .references(() => recruitment.id, { onDelete: "cascade" }),
});

export const recruiterAvailabilityRelations = relations(
  recruiterAvailability,
  ({ one }) => ({
    recruiter: one(user, {
      fields: [recruiterAvailability.recruiterId],
      references: [user.id],
    }),
    recruitment: one(recruitment, {
      fields: [recruiterAvailability.recruitmentId],
      references: [recruitment.id],
    }),
  }),
);

export const recruitmentPhase = pgTable(
  "recruitment_phase",
  {
    id: serial("id").primaryKey(),
    recruitmentId: integer("recruitment_id")
      .notNull()
      .references(() => recruitment.id, { onDelete: "cascade" }),
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
      fields: [recruitmentPhase.recruitmentId],
      references: [recruitment.id],
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
