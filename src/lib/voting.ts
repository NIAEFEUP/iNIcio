import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { CandidateVote, db } from "./db";
import {
  candidate,
  candidateVote,
  recruiterVote,
  votingPhase,
  votingPhaseCandidate,
  votingPhaseStatus,
} from "@/db/schema";
import { CandidateWithMetadata } from "./candidate";
import { getFilenameUrl } from "./file-upload";
import { application } from "@/drizzle/schema";

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
          isFinished: await getIsVoteFinished(id, c.candidateId),
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

function getIsVoteFinished(votingPhaseId: number, candidateId: string) {
  return db.query.votingPhaseCandidate
    .findFirst({
      where: (vpc) =>
        and(
          eq(vpc.votingPhaseId, votingPhaseId),
          eq(vpc.candidateId, candidateId),
        ),
    })
    .then((res) => res?.voteFinished || false);
}

export async function getVotingPhaseStatus(votingPhaseId: number) {
  return await db.query.votingPhaseStatus.findFirst({
    where: (vps) => eq(vps.votingPhaseId, votingPhaseId),
  });
}

export async function createVotingPhase(
  candidates: Array<string>,
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
            candidateId: candidate,
          })
          .returning({ id: votingPhaseCandidate.candidateId });
      }

      votingPhaseId = await tx
        .insert(votingPhaseStatus)
        .values({
          votingPhaseId: vPhase[0].id,
          candidateId: candidates[0],
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

export async function getVotingPhases(recruitmentId: number) {
  return await db.query.votingPhase.findMany({
    where: (vp) => eq(vp.recruitmentYear, recruitmentId),
  });
}

export async function deleteCandidateVotes(
  votingPhaseId: number,
  candidateId: string,
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(candidateVote)
      .where(
        and(
          eq(candidateVote.votingPhaseId, votingPhaseId),
          eq(candidateVote.candidateId, candidateId),
        ),
      );

    await tx
      .delete(recruiterVote)
      .where(
        and(
          eq(recruiterVote.votingPhaseId, votingPhaseId),
          eq(recruiterVote.candidateId, candidateId),
        ),
      );

    await tx
      .update(votingPhaseCandidate)
      .set({ voteFinished: false })
      .where(
        and(
          eq(votingPhaseCandidate.votingPhaseId, votingPhaseId),
          eq(votingPhaseCandidate.candidateId, candidateId),
        ),
      );
  });
}

export async function makeCandidateVoteDefinitive(
  decision: "accept" | "reject",
  votingPhaseId: number,
  candidateId: string,
) {
  try {
    await db.transaction(async (tx) => {
      const vPhaseCandidate = await tx.query.votingPhaseCandidate.findFirst({
        where: and(
          eq(votingPhaseCandidate.candidateId, candidateId),
          eq(votingPhaseCandidate.votingPhaseId, votingPhaseId),
        ),
      });

      if (vPhaseCandidate.voteFinished) {
        return false;
      }

      const vPhaseStatus = await tx.query.votingPhaseStatus.findFirst({
        where: eq(votingPhaseStatus.votingPhaseId, votingPhaseId),
      });

      const newAcceptedCount =
        decision === "accept"
          ? vPhaseStatus.accepted_candidates + 1
          : vPhaseStatus.accepted_candidates;
      const newRejectedCount =
        decision === "reject"
          ? vPhaseStatus.rejected_candidates + 1
          : vPhaseStatus.rejected_candidates;

      await tx
        .update(votingPhaseStatus)
        .set({
          accepted_candidates: newAcceptedCount,
          rejected_candidates: newRejectedCount,
        })
        .where(eq(votingPhaseStatus.votingPhaseId, votingPhaseId));

      await tx
        .update(votingPhaseCandidate)
        .set({ voteFinished: true })
        .where(eq(votingPhaseCandidate.candidateId, candidateId));

      await tx
        .update(application)
        .set({ accepted: decision === "accept" })
        .where(eq(application.candidateId, candidateId));
    });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function getLatestVotingDecisionForCandidate(candidateId: string) {
  await db.transaction(async (tx) => {
    const latestVotingPhase = await db.query.votingPhaseCandidate.findFirst({
      where: eq(votingPhaseCandidate.candidateId, candidateId),
      orderBy: [desc(votingPhaseCandidate.votingPhaseId)],
      with: {
        votingPhase: true,
      },
    });

    if (!latestVotingPhase || !latestVotingPhase.voteFinished) {
      return null;
    }

    const votes = await db.query.candidateVote.findMany({
      where: and(
        eq(candidateVote.votingPhaseId, latestVotingPhase.votingPhaseId),
        eq(candidateVote.candidateId, candidateId),
      ),
    });

    const approveCount = votes.filter((v) => v.decision === "approve").length;
    const rejectCount = votes.filter((v) => v.decision === "reject").length;

    const c = await db.query.candidate.findFirst({
      where: eq(candidate.userId, candidateId),
      with: {
        application: true,
      },
    });

    const rejected = latestVotingPhase.voteFinished && !application.accepted;

    return {
      votingPhaseId: latestVotingPhase.votingPhaseId,
      voteFinished: latestVotingPhase.voteFinished,
      approveCount,
      rejectCount,
      decision: rejected ? "reject" : "approve",
      createdAt: latestVotingPhase.votingPhase.created_at,
    };
  });
}
