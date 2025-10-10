import {
  CandidateClassification,
  CandidateClassificationValue,
  db,
} from "./db";
import { and, eq } from "drizzle-orm";
import { candidateToClassification } from "@/db/schema";

export async function getClassifications() {
  return await db.query.candidateClassification.findMany({
    with: {
      classificationValues: true,
      candidateToClassification: {
        with: {
          classificationValue: true,
        },
      },
    },
  });
}

export async function updateClassificationSave(
  candidateId: string,
  classification: CandidateClassification,
  classificationValue: CandidateClassificationValue,
) {
  const classif = await db.query.candidateToClassification.findFirst({
    where: eq(candidateToClassification.candidateId, candidateId),
  });

  console.log("CLASSIFICATION VALUE: ", classificationValue);

  if (classif) {
    await db
      .update(candidateToClassification)
      .set({
        classificationValueId: classificationValue.id,
      })
      .where(
        and(
          eq(candidateToClassification.id, classif.id),
          eq(candidateToClassification.candidateId, candidateId),
        ),
      );
  } else {
    await db.insert(candidateToClassification).values({
      candidateId,
      classificationId: classification.id,
      classificationValueId: classificationValue.id,
    });
  }
}
