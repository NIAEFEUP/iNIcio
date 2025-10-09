import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { candidate } from "./user_roles";
import { relations } from "drizzle-orm";

export const candidateClassification = pgTable("candidate_classification", {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  value: integer("classification_value_id").references(
    () => candidateClassificationValue.id,
  ),
});

export const candidateToClassification = pgTable(
  "candidate_to_classification",
  {
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidate.userId),
    classificationId: integer("classification_id")
      .notNull()
      .references(() => candidateClassification.id),
  },
);

export const candidateClassificationValue = pgTable("classification_value", {
  id: serial().primaryKey().notNull(),
  value: text().notNull(),
  points: integer().notNull(),
  candidateClassificationId: integer("candidate_classification_id")
    .notNull()
    .references(() => candidateClassification.id),
});

export const candidateClassificationRelations = relations(
  candidateClassification,
  ({ many }) => ({
    classificationValues: many(candidateClassificationValue),
  }),
);
