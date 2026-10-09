import "server-only";

import { and, eq } from "drizzle-orm";
import {
  candidateVote,
  votingPhase,
  votingPhaseCandidate,
  votingPhaseStatus,
} from "@/db/schema";
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
      type: "progress_updated";
      payload: SessionProgress;
    };

export interface SessionProgress {
  finishedCandidateIds: string[];
  acceptedCandidates: number;
  rejectedCandidates: number;
  terminated: boolean;
}

export async function broadcastVotingEvent(
  votingPhaseId: number,
  event: VotingEvent,
) {
  const url = WEBSOCKET_URL;
  if (!url) {
    throw new Error("[voting-events] NEXT_PUBLIC_WEBSOCKET_URL is not set");
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
      const errorBody = await response.text();
      console.error(
        "[voting-events] broadcast failed",
        response.status,
        errorBody,
      );
      throw new Error(
        `Failed to broadcast voting event: ${response.status} ${errorBody}`,
      );
    }
  } catch (error) {
    console.error("[voting-events] broadcast error", error);
    throw error;
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

async function getSessionProgress(
  votingPhaseId: number,
): Promise<SessionProgress> {
  const [phase, status, finished] = await Promise.all([
    db.query.votingPhase.findFirst({
      where: eq(votingPhase.id, votingPhaseId),
      columns: { terminated: true },
    }),
    db.query.votingPhaseStatus.findFirst({
      where: eq(votingPhaseStatus.votingPhaseId, votingPhaseId),
    }),
    db.query.votingPhaseCandidate.findMany({
      where: and(
        eq(votingPhaseCandidate.votingPhaseId, votingPhaseId),
        eq(votingPhaseCandidate.voteFinished, true),
      ),
      columns: { candidateId: true },
    }),
  ]);

  return {
    finishedCandidateIds: finished.map((c) => c.candidateId),
    acceptedCandidates: status?.accepted_candidates ?? 0,
    rejectedCandidates: status?.rejected_candidates ?? 0,
    terminated: phase?.terminated ?? false,
  };
}

// Sends the full session progress. The payload is absolute, so receiving it
// twice or out of order leaves the same state.
export async function broadcastProgress(votingPhaseId: number) {
  const payload = await getSessionProgress(votingPhaseId);
  await broadcastVotingEvent(votingPhaseId, {
    type: "progress_updated",
    payload,
  });
}

// The database write has already committed when we broadcast. A broadcast
// failure must not turn a saved vote into an error; clients re-sync on their
// next join.
export async function notifyClients(send: () => Promise<void>) {
  try {
    await send();
  } catch (error) {
    console.error("[voting] realtime update failed", error);
  }
}
