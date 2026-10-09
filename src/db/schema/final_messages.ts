import { integer, jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";
import { recruitment } from "./recruitment";
import { relations } from "drizzle-orm";

export const finalMessageTemplate = pgTable("final_message_template", {
  id: serial("id").primaryKey(),
  recruitmentId: integer("recruitment_id").references(() => recruitment.id, {
    onDelete: "cascade",
  }),
  type: text("decision", { enum: ["approved", "rejected"] }),
  content: jsonb("content").notNull().default([]),
});

export const finalMessageTemplateRelations = relations(
  finalMessageTemplate,
  ({ one }) => ({
    recruitment: one(recruitment, {
      fields: [finalMessageTemplate.recruitmentId],
      references: [recruitment.id],
    }),
  }),
);
