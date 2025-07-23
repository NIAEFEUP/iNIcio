import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { interview } from "./interview";
import { recruiter } from "./user_roles";
import { relations } from "drizzle-orm";
import { dynamic } from "./dynamic";
import { application } from "./application";

export const interviewComment = pgTable("interview_comment", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  interviewId: integer("interview_id")
    .notNull()
    .references(() => interview.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => recruiter.userId, { onDelete: "cascade" }),
});

export const interviewCommentRelations = relations(
  interviewComment,
  ({ one }) => ({
    dynamic: one(interview, {
      fields: [interviewComment.interviewId],
      references: [interview.id],
    }),
    author: one(recruiter, {
      fields: [interviewComment.authorId],
      references: [recruiter.userId],
    }),
  }),
);

export const dynamicComment = pgTable("dynamic_comment", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  dynamicId: integer("dynamic_id")
    .notNull()
    .references(() => dynamic.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => recruiter.userId, { onDelete: "cascade" }),
});

export const dynamicCommentRelations = relations(dynamicComment, ({ one }) => ({
  dynamic: one(dynamic, {
    fields: [dynamicComment.dynamicId],
    references: [dynamic.id],
  }),
  author: one(recruiter, {
    fields: [dynamicComment.authorId],
    references: [recruiter.userId],
  }),
}));

export const applicationComment = pgTable("application_comment", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => application.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => recruiter.userId, { onDelete: "cascade" }),
});

export const applicationCommentRelations = relations(
  applicationComment,
  ({ one }) => ({
    application: one(application, {
      fields: [applicationComment.applicationId],
      references: [application.id],
    }),
    author: one(recruiter, {
      fields: [applicationComment.authorId],
      references: [recruiter.userId],
    }),
  }),
);
