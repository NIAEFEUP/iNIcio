import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "./db";
import {
  candidate,
  candidateToDynamic,
  candidateVote,
  interview,
  recruiterVote,
  votingPhase,
  votingPhaseCandidate,
  votingPhaseStatus,
} from "@/db/schema";
import { application } from "@/drizzle/schema";

export async function getCurrentVotingPhase(recruitmentYear: number) {
  return await db.query.votingPhase.findFirst({
    where: (vp) => eq(vp.recruitmentYear, recruitmentYear),
    with: {
      status: true,
    },
  });
}

export async function getVotingPhaseStatus(votingPhaseId: number) {
  return await db.query.votingPhaseStatus.findFirst({
    where: (vps) => eq(vps.votingPhaseId, votingPhaseId),
  });
}

export async function createVotingPhase(recruitmentYear: number) {
  try {
    await db.transaction(async (tx) => {
      const vPhase = await tx
        .insert(votingPhase)
        .values({ recruitmentYear })
        .returning({ id: votingPhase.id });

      const candidates = await tx
        .select()
        .from(candidate)
        .innerJoin(application, eq(candidate.userId, application.candidateId))
        .innerJoin(interview, eq(candidate.userId, interview.candidateId))
        .innerJoin(
          candidateToDynamic,
          eq(candidate.userId, candidateToDynamic.candidateId),
        );

      for (const candidate of candidates) {
        await tx
          .insert(votingPhaseCandidate)
          .values({
            votingPhaseId: vPhase[0].id,
            candidateId: candidate.candidate.userId,
          })
          .returning({ id: votingPhaseCandidate.candidateId });
      }

      await tx.insert(votingPhaseStatus).values({
        votingPhaseId: vPhase[0].id,
        candidateId: candidates[0].candidate.userId,
        accepted_candidates: 0,
        rejected_candidates: 0,
      });
    });

    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function voteForCandidate(
  votingPhaseId: number,
  recruiterId: string,
  candidateId: string,
  decision: "approve" | "reject",
) {
  try {
    await db.transaction(async (tx) => {
      await tx.insert(candidateVote).values({
        votingPhaseId,
        candidateId,
        decision,
      });

      await tx.insert(recruiterVote).values({
        votingPhaseId,
        recruiterId,
        candidateId,
      });
    });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function changeCurrentVotingPhaseStatusCandidate(
  votingPhaseId: number,
  candidateId: string,
) {
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(votingPhaseStatus)
        .set({
          candidateId,
        })
        .where(eq(votingPhaseStatus.votingPhaseId, votingPhaseId));
    });

    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function getRecruiterVotes(
  votingPhaseId: number,
  recruiterId: string,
) {
  return await db.query.recruiterVote.findMany({
    where: (rv) =>
      and(eq(rv.votingPhaseId, votingPhaseId), eq(rv.recruiterId, recruiterId)),
  });
}
