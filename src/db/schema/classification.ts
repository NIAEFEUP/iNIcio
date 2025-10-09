import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { candidate } from "./user_roles";

export const candidateClassification = pgTable("classification", {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  value: text("classification_value_id").references(
    () => candidateClassificationValue.id,
  ),
});

export const candidateClassificationValue = pgTable("classification_value", {
  id: serial().primaryKey().notNull(),
  classificationId: text("classification_id").notNull(),
  value: text().notNull(),
});

export const candidateToClassification = pgTable(
  "candidate_to_classification",
  {
    id: serial().primaryKey().notNull(),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidate.userId),
    classificationId: text("classification_id")
      .notNull()
      .references(() => candidateClassification.id),
  },
);
