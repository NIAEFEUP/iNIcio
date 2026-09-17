import {
  integer,
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  primaryKey,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { candidate } from "./user_roles";
import { relations } from "drizzle-orm";
import { applicationToTag } from "./tag";
import { applicationComment } from "./comment";
import { appreciation } from "./appreciation";
import { user } from "./auth";
import { recruitment } from "./recruitment";

export const application = pgTable(
  "application",
  {
    id: serial("id").primaryKey(),
    recruitmentId: integer("recruitment_id")
      .notNull()
      .references(() => recruitment.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    studentNumber: integer("student_number").notNull(),
    fullName: text("full_name").notNull(),
    linkedIn: text("linkedin"),
    github: text("github"),
    personalWebsite: text("personal_website"),
    phone: text("phone"),
    studentYear: text("student_year"),
    degree: text("degree"),
    curricularYear: text("curricular_year"),
    profilePicture: text("profile_picture"),
    curriculum: text("curriculum"),
    experience: text("experience"),
    motivation: text("motivation"),
    selfPromotion: text("self_promotion"),
    interestJustification: text("interest_justification"),
    recruitmentFirstInteraction: text("recruitment_first_interaction"),
    suggestions: text("suggestions"),
    accepted: boolean("accepted").notNull().default(false),
  },
  (table) => [
    unique("application_candidate_recruitment_unique").on(
      table.candidateId,
      table.recruitmentId,
    ),
    index("application_recruitment_id_idx").on(table.recruitmentId),
  ],
);

export const applicationInterests = pgTable(
  "application_interests",
  {
    applicationId: integer("application_id")
      .notNull()
      .references(() => application.id, { onDelete: "cascade" }),
    interest: text("interest").notNull(),
  },
  (table) => [primaryKey({ columns: [table.applicationId, table.interest] })],
);

export const applicationInterestsRelations = relations(
  applicationInterests,
  ({ one }) => ({
    application: one(application, {
      fields: [applicationInterests.applicationId],
      references: [application.id],
    }),
  }),
);

export const applicationRelations = relations(application, ({ one, many }) => ({
  candidate: one(candidate, {
    fields: [application.candidateId, application.recruitmentId],
    references: [candidate.userId, candidate.recruitmentId],
  }),
  recruitment: one(recruitment, {
    fields: [application.recruitmentId],
    references: [recruitment.id],
  }),
  appreciations: many(appreciation),
  applicationToTags: many(applicationToTag),
  comments: many(applicationComment),
  interests: many(applicationInterests),
}));
