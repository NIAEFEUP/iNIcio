import { candidate } from "@/db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export default async function getCandidateWithInterviewAndDynamic(
  candidateId: string,
) {
  return await db.query.candidate.findFirst({
    where: eq(candidate.userId, candidateId),
    with: {
      user: true,
      dynamic: true,
      interview: {
        with: {
          slot: true,
        },
      },
      application: {
        with: {
          interests: true,
        },
      },
    },
  });
}
