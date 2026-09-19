import "server-only";

import { and, count, eq } from "drizzle-orm";
import { candidateVote, votingPhaseCandidate } from "@/db/schema";
import { db } from "./db";
import { generateServerJWT } from "./jwt";

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL?.replace(
  /^ws/,
  "http",
);

export type VotingEvent =
  | {
      type: "status_changed";
      payload: { candidateId: string };
    }
  | {
      type: "vote_updated";
      payload: {
        candidateId: string;
        approvedCount: number;
        rejectedCount: number;
        votedCount: number;
      };
    }
  | {
      type: "votes_reset";
      payload: {
        candidateId: string;
        votedCount: number;
      };
    }
  | {
      type: "candidate_finished";
      payload: {
        candidateId: string;
        decision: "accept" | "reject";
        finishedCandidates: number;
      };
    };

export async function broadcastVotingEvent(
  votingPhaseId: number,
  event: VotingEvent,
) {
  const url = WEBSOCKET_URL;
  if (!url) {
    console.warn("[voting-events] NEXT_PUBLIC_WEBSOCKET_URL is not set");
    return;
  }

  try {
    const token = await generateServerJWT();
    const response = await fetch(`${url}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        room: `voting/${votingPhaseId}`,
        event,
      }),
    });

    if (!response.ok) {
      console.error(
        "[voting-events] broadcast failed",
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    console.error("[voting-events] broadcast error", error);
  }
}

async function getCandidateVoteCounts(
  votingPhaseId: number,
  candidateId: string,
) {
  const votes = await db.query.candidateVote.findMany({
    where: and(
      eq(candidateVote.votingPhaseId, votingPhaseId),
      eq(candidateVote.candidateId, candidateId),
    ),
  });

  const approvedCount = votes.filter((v) => v.decision === "approve").length;
  const rejectedCount = votes.filter((v) => v.decision === "reject").length;
  return { approvedCount, rejectedCount, votedCount: votes.length };
}

async function getFinishedCandidatesCount(votingPhaseId: number) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(votingPhaseCandidate)
    .where(
      and(
        eq(votingPhaseCandidate.votingPhaseId, votingPhaseId),
        eq(votingPhaseCandidate.voteFinished, true),
      ),
    );
  return value;
}

export async function broadcastVoteUpdated(
  votingPhaseId: number,
  candidateId: string,
) {
  const { approvedCount, rejectedCount, votedCount } =
    await getCandidateVoteCounts(votingPhaseId, candidateId);

  await broadcastVotingEvent(votingPhaseId, {
    type: "vote_updated",
    payload: {
      candidateId,
      approvedCount,
      rejectedCount,
      votedCount,
    },
  });
}

export async function broadcastStatusChanged(
  votingPhaseId: number,
  candidateId: string,
) {
  await broadcastVotingEvent(votingPhaseId, {
    type: "status_changed",
    payload: { candidateId },
  });
}

export async function broadcastVotesReset(
  votingPhaseId: number,
  candidateId: string,
) {
  await broadcastVotingEvent(votingPhaseId, {
    type: "votes_reset",
    payload: {
      candidateId,
      votedCount: 0,
    },
  });
}

export async function broadcastCandidateFinished(
  votingPhaseId: number,
  candidateId: string,
  decision: "accept" | "reject",
) {
  const finishedCandidates = await getFinishedCandidatesCount(votingPhaseId);

  await broadcastVotingEvent(votingPhaseId, {
    type: "candidate_finished",
    payload: {
      candidateId,
      decision,
      finishedCandidates,
    },
  });
}
