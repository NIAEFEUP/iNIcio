import {
  integer,
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { candidate } from "./user_roles";
import { relations } from "drizzle-orm";
import { applicationToTag } from "./tag";
import { applicationComment } from "./comment";
import { appreciation } from "./appreciation";

export const application = pgTable("application", {
  id: serial("id").primaryKey(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  studentNumber: integer("student_number").notNull(),
  linkedIn: text("linkedin"),
  github: text("github"),
  personalWebsite: text("personal_website"),

  // TODO: remaining forms fields
  //
  accepted: boolean("accepted").notNull().default(false),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidate.userId, { onDelete: "cascade" })
    .unique(),
});

export const applicationRelations = relations(application, ({ one, many }) => ({
  candidate: one(candidate, {
    fields: [application.candidateId],
    references: [candidate.userId],
  }),
  appreciations: many(appreciation),
  applicationToTags: many(applicationToTag),
  comments: many(applicationComment),
}));
