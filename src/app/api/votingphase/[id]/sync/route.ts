import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  broadcastFinishedUpdated,
  broadcastStatusChanged,
  broadcastVoteUpdated,
} from "@/lib/voting-events";
import { getVotingPhaseStatus } from "@/lib/voting";

export async function POST(request: NextRequest, context: any) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      typeof payload !== "object" ||
      payload === null ||
      payload.role !== "server"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: votingPhaseId } = await context.params;

    const status = await getVotingPhaseStatus(votingPhaseId);
    if (status?.candidateId) {
      await broadcastStatusChanged(votingPhaseId, status.candidateId);
      await broadcastVoteUpdated(votingPhaseId, status.candidateId);
    }
    await broadcastFinishedUpdated(votingPhaseId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Voting sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
