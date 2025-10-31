import { jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";

export const finalMessageTemplate = pgTable("final_message_template", {
  id: serial("id").primaryKey(),
  type: text("decision", { enum: ["approved", "rejected"] }),
  content: jsonb("content").notNull().default([]),
});
