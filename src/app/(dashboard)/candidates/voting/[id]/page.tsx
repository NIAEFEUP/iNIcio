import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import { generateJWT } from "@/lib/jwt";
import { isRecruiter } from "@/lib/recruiter";
import {
  changeCurrentVotingPhaseStatusCandidate,
  deleteCandidateVotes,
  getCurrentVotingPhase,
  getRecruiterVotes,
  getVotingPhaseRecruitmentId,
  makeCandidateVoteDefinitive,
  voteForCandidate,
} from "@/lib/voting";
import {
  requireAdminSession,
  requireRecruiterSession,
} from "@/lib/action-guard";
import {
  broadcastProgress,
  broadcastStatusChanged,
  broadcastVoteUpdated,
  broadcastVotesReset,
} from "@/lib/voting-events";
import { AdminVotingView } from "@/components/candidate/voting/admin-voting-view";
import { RecruiterVotingView } from "@/components/candidate/voting/recruiter-voting-view";

// The database write has already committed when we broadcast. A broadcast
// failure must not turn a saved vote into an error; clients re-sync on their
// next join.
async function notifyClients(send: () => Promise<void>) {
  try {
    await send();
  } catch (error) {
    console.error("[voting] realtime update failed", error);
  }
}

interface CandidateVotingPageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateVotingPage({
  params,
}: CandidateVotingPageProps) {
  const session = await getSession();
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    redirect("/candidates/voting");
  }

  const userIsAdmin = session?.user.id ? await isAdmin(session.user.id) : false;

  const currentVotingPhase = await getCurrentVotingPhase(numId);
  if (!currentVotingPhase) {
    redirect("/candidates/voting");
  }

  // The websocket room token carries the role the server should use. The
  // role comes from the same checks the rest of the page uses, never from
  // "not admin means recruiter".
  const votingRecruitmentId = await getVotingPhaseRecruitmentId(numId);
  const userIsRecruiter =
    session?.user.id && votingRecruitmentId
      ? await isRecruiter(session.user.id, votingRecruitmentId)
      : false;
  const wsRole = userIsAdmin ? "admin" : userIsRecruiter ? "recruiter" : null;
  const wsToken =
    session?.user.id && wsRole
      ? await generateJWT(session.user.id, wsRole, [`voting/${numId}`])
      : "";

  async function submitVoteAction(
    recruiterId: string,
    candidateId: string,
    decision: "approve" | "reject",
  ) {
    "use server";

    const recruitmentId = await getVotingPhaseRecruitmentId(numId);
    if (!recruitmentId) throw new Error("Voting phase not found");

    const user = await requireRecruiterSession(recruitmentId);
    const effectiveRecruiterId = user.id;

    const recruiterVotes = await getRecruiterVotes(numId, effectiveRecruiterId);

    if (!recruiterVotes.find((v) => v.candidateId === candidateId)) {
      const ok = await voteForCandidate(
        numId,
        effectiveRecruiterId,
        candidateId,
        decision,
      );
      if (ok) {
        await notifyClients(() => broadcastVoteUpdated(numId, candidateId));
      }
      return ok;
    }

    return false;
  }

  async function changeCurrentVotingPhaseStatusCandidateAction(
    votingPhaseId: number,
    candidateId: string,
  ) {
    "use server";
    await requireAdminSession();

    const ok = await changeCurrentVotingPhaseStatusCandidate(
      votingPhaseId,
      candidateId,
    );
    if (ok) {
      await notifyClients(async () => {
        await broadcastStatusChanged(votingPhaseId, candidateId);
        await broadcastVoteUpdated(votingPhaseId, candidateId);
      });
    }
    return ok;
  }

  async function makeVoteDefinitiveAction(
    decision: "accept" | "reject",
    votingPhaseId: number,
    candidateId: string,
  ) {
    "use server";
    await requireAdminSession();

    const ok = await makeCandidateVoteDefinitive(
      decision,
      votingPhaseId,
      candidateId,
    );
    if (ok) {
      await notifyClients(() => broadcastProgress(votingPhaseId));
    }
    return ok;
  }

  async function resetCandidateVotesAction(
    votingPhaseId: number,
    candidateId: string,
  ) {
    "use server";
    await requireAdminSession();

    await deleteCandidateVotes(votingPhaseId, candidateId);
    await notifyClients(() => broadcastVotesReset(votingPhaseId, candidateId));
  }

  if (userIsAdmin) {
    return (
      <AdminVotingView
        currentVotingPhase={currentVotingPhase as any}
        changeCurrentVotingPhaseStatusCandidateAction={
          changeCurrentVotingPhaseStatusCandidateAction
        }
        makeVoteDefinitiveAction={makeVoteDefinitiveAction}
        resetCandidateVotesAction={resetCandidateVotesAction}
        token={wsToken}
      />
    );
  }

  const recruiterVotes = session?.user.id
    ? await getRecruiterVotes(currentVotingPhase.id, session.user.id)
    : [];

  return (
    <RecruiterVotingView
      currentVotingPhase={currentVotingPhase as any}
      recruiterVotes={recruiterVotes}
      submitVoteAction={submitVoteAction}
      currentUserId={session?.user.id || ""}
      showBack={true}
    />
  );
}
