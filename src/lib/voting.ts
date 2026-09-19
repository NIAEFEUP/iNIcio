import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import {
  application,
  candidate,
  candidateVote,
  recruiterVote,
  votingPhase,
  votingPhaseCandidate,
  votingPhaseStatus,
} from "@/db/schema";
import { getCandidateWithMetadata } from "./candidate";

export async function getCurrentVotingPhase(id: number) {
  const vPhase = await db.query.votingPhase.findFirst({
    where: (vp) => eq(vp.id, id),
    with: {
      status: true,
      candidates: true,
    },
  });

  if (!vPhase) return null;

  const candidates = await Promise.all(
    vPhase.candidates.map(async (c) => {
      const candidateData = await getCandidateWithMetadata(
        c.candidateId,
        vPhase.recruitmentId,
      );
      return {
        ...candidateData,
        isFinished: await getIsVoteFinished(id, c.candidateId),
      };
    }),
  );

  return {
    ...vPhase,
    status: vPhase.status!,
    candidates,
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

import { getActiveRecruitment } from "./recruitment";

export async function createVotingPhase(
  candidates: Array<string>,
  recruitmentId?: number,
) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) {
    throw new Error("No recruitment specified or active");
  }

  let votingPhaseId = null;

  try {
    await db.transaction(async (tx) => {
      const vPhase = await tx
        .insert(votingPhase)
        .values({ recruitmentId: targetId })
        .returning({ id: votingPhase.id });

      for (const candidate of candidates) {
        await tx
          .insert(votingPhaseCandidate)
          .values({
            votingPhaseId: vPhase[0].id,
            candidateId: candidate,
            recruitmentId: targetId,
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

export async function getVotingPhaseRecruitmentId(votingPhaseId: number) {
  const phase = await db.query.votingPhase.findFirst({
    where: eq(votingPhase.id, votingPhaseId),
    columns: { recruitmentId: true },
  });

  return phase?.recruitmentId ?? null;
}

export async function voteForCandidate(
  votingPhaseId: number,
  recruiterId: string,
  candidateId: string,
  decision: "approve" | "reject",
) {
  try {
    const phaseCandidate = await db.query.votingPhaseCandidate.findFirst({
      where: and(
        eq(votingPhaseCandidate.votingPhaseId, votingPhaseId),
        eq(votingPhaseCandidate.candidateId, candidateId),
      ),
    });

    // Do not accept votes once the candidate's result has been finalized.
    if (!phaseCandidate || phaseCandidate.voteFinished) return false;

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

export async function getVotingPhases(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  return await db.query.votingPhase.findMany({
    where: (vp) => eq(vp.recruitmentId, targetId),
  });
}

export async function deleteCandidateVotes(
  votingPhaseId: number,
  candidateId: string,
) {
  await db.transaction(async (tx) => {
    const vp = await tx.query.votingPhase.findFirst({
      where: eq(votingPhase.id, votingPhaseId),
    });

    if (!vp) return;

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

    await tx
      .update(application)
      .set({ accepted: false })
      .where(
        and(
          eq(application.candidateId, candidateId),
          eq(application.recruitmentId, vp.recruitmentId),
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
      const vp = await tx.query.votingPhase.findFirst({
        where: eq(votingPhase.id, votingPhaseId),
      });

      if (!vp) {
        return false;
      }

      const vPhaseCandidate = await tx.query.votingPhaseCandidate.findFirst({
        where: and(
          eq(votingPhaseCandidate.candidateId, candidateId),
          eq(votingPhaseCandidate.votingPhaseId, votingPhaseId),
        ),
      });

      if (!vPhaseCandidate || vPhaseCandidate.voteFinished) {
        return false;
      }

      const vPhaseStatus = await tx.query.votingPhaseStatus.findFirst({
        where: eq(votingPhaseStatus.votingPhaseId, votingPhaseId),
      });

      if (!vPhaseStatus) {
        return false;
      }

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
        .where(
          and(
            eq(votingPhaseCandidate.votingPhaseId, votingPhaseId),
            eq(votingPhaseCandidate.candidateId, candidateId),
          ),
        );

      await tx
        .update(application)
        .set({ accepted: decision === "accept" })
        .where(
          and(
            eq(application.candidateId, candidateId),
            eq(application.recruitmentId, vp.recruitmentId),
          ),
        );
    });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function getLatestVotingDecisionForCandidate(
  candidateId: string,
  recruitmentId?: number,
) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return null;

  const latestVotingPhases = await db.query.votingPhaseCandidate.findMany({
    where: eq(votingPhaseCandidate.candidateId, candidateId),
    orderBy: [desc(votingPhaseCandidate.votingPhaseId)],
    with: {
      votingPhase: true,
    },
  });

  const matchingPhase = latestVotingPhases.find(
    (p) => p.votingPhase.recruitmentId === targetId,
  );

  if (!matchingPhase || !matchingPhase.voteFinished) {
    return null;
  }

  const votes = await db.query.candidateVote.findMany({
    where: and(
      eq(candidateVote.votingPhaseId, matchingPhase.votingPhaseId),
      eq(candidateVote.candidateId, candidateId),
    ),
  });

  const approveCount = votes.filter((v) => v.decision === "approve").length;
  const rejectCount = votes.filter((v) => v.decision === "reject").length;

  const c = await db.query.candidate.findFirst({
    where: and(
      eq(candidate.userId, candidateId),
      eq(candidate.recruitmentId, targetId),
    ),
    with: {
      application: true,
    },
  });

  const rejected = matchingPhase.voteFinished && !c?.application?.accepted;

  return {
    votingPhaseId: matchingPhase.votingPhaseId,
    voteFinished: matchingPhase.voteFinished,
    approveCount,
    rejectCount,
    decision: rejected ? "reject" : ("approve" as "approve" | "reject"),
    createdAt: matchingPhase.votingPhase.created_at,
  };
}
