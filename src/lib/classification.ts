import { db } from "./db";

export async function getClassifications() {
  return await db.query.candidateClassification.findMany({
    with: {},
  });
}
