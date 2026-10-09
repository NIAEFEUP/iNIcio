import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import {
  changeCurrentVotingPhaseStatusCandidate,
  deleteCandidateVotes,
  getCandidateVotes,
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
  broadcastCandidateFinished,
  broadcastStatusChanged,
  broadcastVoteUpdated,
  broadcastVotesReset,
} from "@/lib/voting-events";
import { generateJWT } from "@/lib/jwt";
import { AdminVotingView } from "@/components/candidate/voting/admin-voting-view";
import { RecruiterVotingView } from "@/components/candidate/voting/recruiter-voting-view";

interface CandidateVotingPageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateVotingPage({
  params,
}: CandidateVotingPageProps) {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    redirect("/candidates/voting");
  }

  const userIsAdmin = await isAdmin(session.user.id);
  const userRole = userIsAdmin ? "admin" : "recruiter";

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
      await broadcastCandidateFinished(votingPhaseId, candidateId, decision);
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

  const token = await generateJWT(session.user.id, userRole, [
    `voting/${numId}`,
  ]);

  const initialCandidateId = currentVotingPhase.status.candidateId;
  const initialCandidate = currentVotingPhase.candidates.find(
    (c) => c.id === initialCandidateId,
  );
  const initialCandidateVotes = initialCandidate
    ? await getCandidateVotes(currentVotingPhase.id, initialCandidate.id)
    : [];
  const initialApprovedCount = userIsAdmin
    ? initialCandidateVotes.filter((v) => v.decision === "approve").length
    : 0;
  const initialRejectedCount = userIsAdmin
    ? initialCandidateVotes.filter((v) => v.decision === "reject").length
    : 0;
  const initialVotedCount = initialCandidateVotes.length;
  const initialTotalToVote = 0;
  const initialFinishedCandidates = currentVotingPhase.candidates.filter(
    (c) => c.isFinished,
  ).length;

  if (userIsAdmin) {
    return (
      <AdminVotingView
        currentVotingPhase={currentVotingPhase as any}
        token={token}
        initialCandidateId={initialCandidateId}
        initialApprovedCount={initialApprovedCount}
        initialRejectedCount={initialRejectedCount}
        initialVotedCount={initialVotedCount}
        initialTotalToVote={initialTotalToVote}
        initialFinishedCandidates={initialFinishedCandidates}
        changeCurrentVotingPhaseStatusCandidateAction={
          changeCurrentVotingPhaseStatusCandidateAction
        }
        makeVoteDefinitiveAction={makeVoteDefinitiveAction}
        resetCandidateVotesAction={resetCandidateVotesAction}
      />
    );
  }

  const recruiterVotes = await getRecruiterVotes(
    currentVotingPhase.id,
    session.user.id,
  );

  return (
    <RecruiterVotingView
      currentVotingPhase={currentVotingPhase as any}
      recruiterVotes={recruiterVotes}
      submitVoteAction={submitVoteAction}
      currentUserId={session.user.id}
      token={token}
      showBack={true}
    />
  );
}
