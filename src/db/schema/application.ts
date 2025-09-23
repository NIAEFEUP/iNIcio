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
import { user } from "@/drizzle/schema";

export const application = pgTable("application", {
  id: serial("id").primaryKey(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  studentNumber: integer("student_number").notNull(),
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
  candidateId: text("candidate_id")
    .notNull()
    .references(() => user.id),
});

export const applicationInterests = pgTable("application_interests", {
  applicationId: integer("application_id").notNull(),
  interest: text("interest").notNull(),
});

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
    fields: [application.candidateId],
    references: [candidate.userId],
  }),
  appreciations: many(appreciation),
  applicationToTags: many(applicationToTag),
  comments: many(applicationComment),
  interests: many(applicationInterests),
}));
