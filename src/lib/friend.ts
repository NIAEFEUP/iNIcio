import { db } from "./db";

import { recruiterToCandidate } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function areFriends(
  recruiterId: string,
  candidateId: string,
  recruitmentId?: number,
) {
  const conditions = [
    eq(recruiterToCandidate.recruiterId, recruiterId),
    eq(recruiterToCandidate.candidateId, candidateId),
  ];
  if (recruitmentId !== undefined) {
    conditions.push(eq(recruiterToCandidate.recruitmentId, recruitmentId));
  }
  return (
    (
      await db
        .select()
        .from(recruiterToCandidate)
        .where(and(...conditions))
    ).length > 0
  );
}

export async function getFriendsOf(recruiterId: string) {
  return await db
    .select()
    .from(recruiterToCandidate)
    .where(eq(recruiterToCandidate.recruiterId, recruiterId));
}

export async function addFriend(candidateId: string) {
  const result = await fetch("/api/friends", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      candidateId: candidateId,
    }),
  });

  return result.ok;
}
