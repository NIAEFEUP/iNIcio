import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { candidate } from "./user_roles";
import { relations } from "drizzle-orm";

export const candidateClassification = pgTable("candidate_classification", {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
});

export const candidateClassificationValue = pgTable(
  "candidate_classification_value",
  {
    id: serial().primaryKey().notNull(),
    classificationId: integer("candidate_classification_id")
      .notNull()
      .references(() => candidateClassification.id),
    value: text().notNull(),
    severityLevel: integer("severity_level").notNull().default(1),
  },
);

export const candidateClassificationValueRelations = relations(
  candidateClassificationValue,
  ({ one }) => ({
    classification: one(candidateClassification, {
      fields: [candidateClassificationValue.classificationId],
      references: [candidateClassification.id],
    }),
  }),
);

export const candidateClassificationRelations = relations(
  candidateClassification,
  ({ one, many }) => ({
    classificationValues: many(candidateClassificationValue),
    candidateToClassification: one(candidateToClassification, {
      fields: [candidateClassification.id],
      references: [candidateToClassification.classificationId],
    }),
  }),
);

export const candidateToClassification = pgTable(
  "candidate_to_classification",
  {
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidate.userId),
    classificationId: integer("classification_id")
      .notNull()
      .references(() => candidateClassification.id),
    classificationValueId: integer("classification_value_id")
      .notNull()
      .references(() => candidateClassificationValue.id),
  },
);

export const candidateToClassificationRelations = relations(
  candidateToClassification,
  ({ one }) => ({
    classification: one(candidateClassification, {
      fields: [candidateToClassification.classificationId],
      references: [candidateClassification.id],
    }),
    classificationValue: one(candidateClassificationValue, {
      fields: [candidateToClassification.classificationValueId],
      references: [candidateClassificationValue.id],
    }),
  }),
);
