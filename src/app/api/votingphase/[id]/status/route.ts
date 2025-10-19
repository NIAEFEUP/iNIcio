import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { isRecruiter } from "@/lib/recruiter";
import { getVotingPhaseStatus } from "@/lib/voting";

export async function GET(request: NextRequest, context: any) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !(await isAdmin(session.user.id)) &&
      !(await isRecruiter(session.user.id))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: votingPhaseId } = await context.params;

    return NextResponse.json({
      votingPhaseStatus: await getVotingPhaseStatus(votingPhaseId),
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
