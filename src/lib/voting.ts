import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "./db";
import {
  candidateVote,
  recruiterVote,
  votingPhase,
  votingPhaseCandidate,
  votingPhaseStatus,
} from "@/db/schema";
import { CandidateWithMetadata } from "./candidate";
import { getFilenameUrl } from "./file-upload";

export async function getCurrentVotingPhase(id: number) {
  const vPhase = await db.query.votingPhase.findFirst({
    where: (vp) => eq(vp.id, id),
    with: {
      status: true,
      candidates: {
        with: {
          candidate: {
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
              interview: true,
              application: {
                with: {
                  interests: true,
                },
              },
              knownRecruiters: true,
            },
          },
        },
      },
    },
  });

  return {
    ...vPhase,
    candidates: await Promise.all(
      vPhase.candidates.map(async (c) => ({
        ...{
          ...c.candidate.user,
          image: await getFilenameUrl(c.candidate.user?.image),
          dynamic: c.candidate.dynamic,
          interview: c.candidate.interview,
          dynamicClassification: c.candidate.dynamicClassification,
          interviewClassification: c.candidate.interviewClassification,
          knownRecruiters: c.candidate.knownRecruiters,
          application: {
            ...c.candidate.application,
            profilePicture: await getFilenameUrl(
              c.candidate.application?.profilePicture,
            ),
            curriculum: await getFilenameUrl(
              c.candidate.application?.curriculum,
            ),
            interests: c.candidate.application?.interests.map(
              (i) => i.interest,
            ),
          },
        },
      })),
    ),
  };
}

export async function getVotingPhaseStatus(votingPhaseId: number) {
  return await db.query.votingPhaseStatus.findFirst({
    where: (vps) => eq(vps.votingPhaseId, votingPhaseId),
  });
}

export async function createVotingPhase(
  candidates: Array<CandidateWithMetadata>,
  recruitmentYear: number,
) {
  let votingPhaseId = null;

  try {
    await db.transaction(async (tx) => {
      const vPhase = await tx
        .insert(votingPhase)
        .values({ recruitmentYear })
        .returning({ id: votingPhase.id });

      for (const candidate of candidates) {
        await tx
          .insert(votingPhaseCandidate)
          .values({
            votingPhaseId: vPhase[0].id,
            candidateId: candidate.id,
          })
          .returning({ id: votingPhaseCandidate.candidateId });
      }

      votingPhaseId = await tx
        .insert(votingPhaseStatus)
        .values({
          votingPhaseId: vPhase[0].id,
          candidateId: candidates[0].id,
          accepted_candidates: 0,
          rejected_candidates: 0,
        })
        .returning({ votingPhaseId: votingPhaseStatus.votingPhaseId });
    });

    return votingPhaseId;
  } catch (e) {
    console.log(e);
    return null;
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

export async function getCandidateVotes(
  votingPhaseId: number,
  candidateId: string,
) {
  return await db.query.candidateVote.findMany({
    where: (cv) =>
      and(eq(cv.votingPhaseId, votingPhaseId), eq(cv.candidateId, candidateId)),
  });
}
