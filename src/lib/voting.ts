import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  application,
  candidateVote,
  recruiterVote,
  votingPhase,
  votingPhaseCandidate,
  votingPhaseStatus,
} from "@/db/schema";
import { getCandidatesWithMetadata } from "./candidate";

export async function getCurrentVotingPhase(id: number) {
  const vPhase = await db.query.votingPhase.findFirst({
    where: (vp) => eq(vp.id, id),
    with: {
      status: true,
      candidates: true,
    },
  });

  if (!vPhase) return null;

  const candidatesById = new Map(
    (
      await getCandidatesWithMetadata(
        vPhase.candidates.map((c) => c.candidateId),
        vPhase.recruitmentId,
      )
    ).map((c) => [c.id, c]),
  );

  const candidates = vPhase.candidates
    .map((c) => {
      const candidate = candidatesById.get(c.candidateId);
      return candidate ? { ...candidate, isFinished: c.voteFinished } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return {
    ...vPhase,
    status: vPhase.status!,
    candidates,
  };
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

export interface VotingDecision {
  votingPhaseId: number;
  voteFinished: boolean;
  approveCount: number;
  rejectCount: number;
  decision: "approve" | "reject";
  createdAt: Date | null;
}

/**
 * Resolves the latest voting decision for several candidates in a fixed number
 * of queries, instead of querying per candidate. Candidates without a finished
 * vote in the recruitment map to null.
 */
export async function getLatestVotingDecisionsForCandidates(
  candidateIds: Array<string>,
  recruitmentId?: number,
): Promise<Map<string, VotingDecision | null>> {
  const decisions = new Map<string, VotingDecision | null>();
  const uniqueIds = [...new Set(candidateIds)];
  if (uniqueIds.length === 0) return decisions;

  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) {
    for (const id of uniqueIds) decisions.set(id, null);
    return decisions;
  }

  // Latest voting phase per candidate within the recruitment
  const phases = await db
    .select({
      candidateId: votingPhaseCandidate.candidateId,
      votingPhaseId: votingPhaseCandidate.votingPhaseId,
      voteFinished: votingPhaseCandidate.voteFinished,
      createdAt: votingPhase.created_at,
    })
    .from(votingPhaseCandidate)
    .innerJoin(
      votingPhase,
      eq(votingPhase.id, votingPhaseCandidate.votingPhaseId),
    )
    .where(
      and(
        eq(votingPhase.recruitmentId, targetId),
        inArray(votingPhaseCandidate.candidateId, uniqueIds),
      ),
    )
    .orderBy(desc(votingPhaseCandidate.votingPhaseId));

  const latest = new Map<string, (typeof phases)[number]>();
  for (const phase of phases) {
    if (!latest.has(phase.candidateId)) latest.set(phase.candidateId, phase);
  }

  const finished = [...latest.values()].filter((p) => p.voteFinished);

  const votesByCandidate = new Map<
    string,
    { approve: number; reject: number }
  >();
  if (finished.length > 0) {
    const votes = await db
      .select({
        candidateId: candidateVote.candidateId,
        decision: candidateVote.decision,
      })
      .from(candidateVote)
      .where(
        and(
          inArray(
            candidateVote.votingPhaseId,
            finished.map((p) => p.votingPhaseId),
          ),
          inArray(
            candidateVote.candidateId,
            finished.map((p) => p.candidateId),
          ),
        ),
      );

    for (const vote of votes) {
      const counts = votesByCandidate.get(vote.candidateId) ?? {
        approve: 0,
        reject: 0,
      };
      if (vote.decision === "approve") counts.approve += 1;
      else counts.reject += 1;
      votesByCandidate.set(vote.candidateId, counts);
    }
  }

  const acceptedByCandidate = new Map<string, boolean>();
  if (finished.length > 0) {
    const applications = await db
      .select({
        candidateId: application.candidateId,
        accepted: application.accepted,
      })
      .from(application)
      .where(
        and(
          eq(application.recruitmentId, targetId),
          inArray(application.candidateId, uniqueIds),
        ),
      );
    for (const app of applications) {
      acceptedByCandidate.set(app.candidateId, app.accepted);
    }
  }

  for (const id of uniqueIds) {
    const phase = latest.get(id);
    if (!phase || !phase.voteFinished) {
      decisions.set(id, null);
      continue;
    }

    const counts = votesByCandidate.get(id) ?? { approve: 0, reject: 0 };
    decisions.set(id, {
      votingPhaseId: phase.votingPhaseId,
      voteFinished: true,
      approveCount: counts.approve,
      rejectCount: counts.reject,
      decision: acceptedByCandidate.get(id) ? "approve" : "reject",
      createdAt: phase.createdAt,
    });
  }

  return decisions;
}

export async function getLatestVotingDecisionForCandidate(
  candidateId: string,
  recruitmentId?: number,
) {
  const decisions = await getLatestVotingDecisionsForCandidates(
    [candidateId],
    recruitmentId,
  );
  return decisions.get(candidateId) ?? null;
}

/**
 * Resolves the latest voting decision of one candidate in several recruitments
 * at once, keyed by recruitment id. Candidate metadata (application, decision
 * reveal) is looked up in a fixed number of queries rather than per
 * recruitment.
 */
export async function getLatestVotingDecisionsByRecruitment(
  candidateId: string,
  recruitmentIds: Array<number>,
): Promise<Map<number, VotingDecision | null>> {
  const decisions = new Map<number, VotingDecision | null>();
  const uniqueIds = [...new Set(recruitmentIds)];
  if (uniqueIds.length === 0) return decisions;

  const phases = await db
    .select({
      recruitmentId: votingPhase.recruitmentId,
      votingPhaseId: votingPhaseCandidate.votingPhaseId,
      voteFinished: votingPhaseCandidate.voteFinished,
      createdAt: votingPhase.created_at,
    })
    .from(votingPhaseCandidate)
    .innerJoin(
      votingPhase,
      eq(votingPhase.id, votingPhaseCandidate.votingPhaseId),
    )
    .where(
      and(
        inArray(votingPhase.recruitmentId, uniqueIds),
        eq(votingPhaseCandidate.candidateId, candidateId),
      ),
    )
    .orderBy(desc(votingPhaseCandidate.votingPhaseId));

  const latest = new Map<number, (typeof phases)[number]>();
  for (const phase of phases) {
    if (!latest.has(phase.recruitmentId)) {
      latest.set(phase.recruitmentId, phase);
    }
  }

  const finished = [...latest.values()].filter((p) => p.voteFinished);

  const votesByPhase = new Map<number, { approve: number; reject: number }>();
  if (finished.length > 0) {
    const votes = await db
      .select({
        votingPhaseId: candidateVote.votingPhaseId,
        decision: candidateVote.decision,
      })
      .from(candidateVote)
      .where(
        and(
          inArray(
            candidateVote.votingPhaseId,
            finished.map((p) => p.votingPhaseId),
          ),
          eq(candidateVote.candidateId, candidateId),
        ),
      );

    for (const vote of votes) {
      const counts = votesByPhase.get(vote.votingPhaseId) ?? {
        approve: 0,
        reject: 0,
      };
      if (vote.decision === "approve") counts.approve += 1;
      else counts.reject += 1;
      votesByPhase.set(vote.votingPhaseId, counts);
    }
  }

  const acceptedByRecruitment = new Map<number, boolean>();
  if (finished.length > 0) {
    const applications = await db
      .select({
        recruitmentId: application.recruitmentId,
        accepted: application.accepted,
      })
      .from(application)
      .where(
        and(
          inArray(
            application.recruitmentId,
            finished.map((p) => p.recruitmentId),
          ),
          eq(application.candidateId, candidateId),
        ),
      );
    for (const app of applications) {
      acceptedByRecruitment.set(app.recruitmentId, app.accepted);
    }
  }

  for (const recruitmentId of uniqueIds) {
    const phase = latest.get(recruitmentId);
    if (!phase || !phase.voteFinished) {
      decisions.set(recruitmentId, null);
      continue;
    }

    const counts = votesByPhase.get(phase.votingPhaseId) ?? {
      approve: 0,
      reject: 0,
    };
    decisions.set(recruitmentId, {
      votingPhaseId: phase.votingPhaseId,
      voteFinished: true,
      approveCount: counts.approve,
      rejectCount: counts.reject,
      decision: acceptedByRecruitment.get(recruitmentId) ? "approve" : "reject",
      createdAt: phase.createdAt,
    });
  }

  return decisions;
}
