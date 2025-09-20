import { db } from "./db";

import { recruiterToCandidate } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function areFriends(recruiterId: string, candidateId: string) {
  return (
    (
      await db
        .select()
        .from(recruiterToCandidate)
        .where(
          and(
            eq(recruiterToCandidate.recruiterId, recruiterId),
            eq(recruiterToCandidate.candidateId, candidateId),
          ),
        )
    ).length > 0
  );
}

export async function getFriendsOf(recruiterId: string) {
  return await db
    .select()
    .from(recruiterToCandidate)
    .where(eq(recruiterToCandidate.recruiterId, recruiterId));
}
