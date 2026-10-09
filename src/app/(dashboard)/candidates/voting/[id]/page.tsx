import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getSession } from "@/lib/auth";
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
        await broadcastVoteUpdated(numId, candidateId);
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
      await broadcastStatusChanged(votingPhaseId, candidateId);
      await broadcastVoteUpdated(votingPhaseId, candidateId);
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
      await broadcastProgress(votingPhaseId);
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
    await broadcastVotesReset(votingPhaseId, candidateId);
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
