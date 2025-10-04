import { candidate } from "@/db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function isCandidate(candidateId: string) {
  const query = await db.query.candidate.findFirst({
    where: eq(candidate.userId, candidateId),
  });

  return query !== null && query !== undefined;
}

export default async function getCandidateWithInterviewAndDynamic(
  candidateId: string,
) {
  return await db.query.candidate.findFirst({
    where: eq(candidate.userId, candidateId),
    with: {
      user: true,
      dynamic: {
        with: {
          dynamic: {
            with: {
              slot: true,
            },
          },
        },
      },
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
