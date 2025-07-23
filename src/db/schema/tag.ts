import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { application } from "./application";
import { relations } from "drizzle-orm";

export const tag = pgTable("tag", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const applicationToTag = pgTable("application_to_tag", {
  applicationId: integer("application_id")
    .notNull()
    .references(() => application.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tag.id, { onDelete: "cascade" }),
});

export const tagRelations = relations(tag, ({ many }) => ({
  applicationToTag: many(applicationToTag),
}));

export const applicationToTagRelations = relations(
  applicationToTag,
  ({ one }) => ({
    application: one(application, {
      fields: [applicationToTag.applicationId],
      references: [application.id],
    }),
    tag: one(tag, {
      fields: [applicationToTag.tagId],
      references: [tag.id],
    }),
  }),
);
