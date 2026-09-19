import { CandidateVotingSlideshow } from "@/components/candidate/voting/candidate-voting-slideshow";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import {
  changeCurrentVotingPhaseStatusCandidate,
  getCandidateVotes,
  getCurrentVotingPhase,
  getRecruiterVotes,
  voteForCandidate,
} from "@/lib/voting";
import { headers } from "next/headers";
import { makeCandidateVoteDefinitive } from "@/lib/voting";
import { deleteCandidateVotes } from "@/lib/voting";
import { redirect } from "next/navigation";
import {
  broadcastCandidateFinished,
  broadcastStatusChanged,
  broadcastVoteUpdated,
  broadcastVotesReset,
} from "@/lib/voting-events";
import { generateJWT } from "@/lib/jwt";

interface CandidateVotingPageProps {
  params: any;
}

export default async function CandidateVotingPage({
  params,
}: CandidateVotingPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  const { id } = await params;

  async function submitVoteAction(
    recruiterId: string,
    candidateId: string,
    decision: "approve" | "reject",
  ) {
    "use server";

    const recruiterVotes = await getRecruiterVotes(id, recruiterId);

    if (!recruiterVotes.find((v) => v.candidateId === candidateId)) {
      const ok = await voteForCandidate(id, recruiterId, candidateId, decision);
      if (ok) {
        await broadcastVoteUpdated(id, candidateId);
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

  async function resetCandidateVotes(
    votingPhaseId: number,
    candidateId: string,
  ) {
    "use server";

    await deleteCandidateVotes(votingPhaseId, candidateId);
    await broadcastVotesReset(votingPhaseId, candidateId);
  }

  const admin = await isAdmin(session?.user.id);
  const userRole = admin ? "admin" : "recruiter";

  const currentVotingPhase = await getCurrentVotingPhase(id);
  if (!currentVotingPhase) redirect("/candidates");

  const recruiterVotes = await getRecruiterVotes(
    currentVotingPhase.id,
    session?.user.id,
  );

  const initialCandidateId = currentVotingPhase.status.candidateId;
  const initialCandidate = currentVotingPhase.candidates.find(
    (c) => c.id === initialCandidateId,
  );
  const initialCandidateVotes = initialCandidate
    ? await getCandidateVotes(currentVotingPhase.id, initialCandidate.id)
    : [];
  const initialApprovedCount = initialCandidateVotes.filter(
    (v) => v.decision === "approve",
  ).length;
  const initialRejectedCount = initialCandidateVotes.filter(
    (v) => v.decision === "reject",
  ).length;
  const initialVotedCount = initialCandidateVotes.length;
  const initialTotalToVote = 0;
  const initialFinishedCandidates = currentVotingPhase.candidates.filter(
    (c) => c.isFinished,
  ).length;

  const token = await generateJWT(session?.user.id, userRole);

  return (
    <CandidateVotingSlideshow
      candidates={currentVotingPhase.candidates}
      admin={admin ? true : false}
      currentVotingPhase={currentVotingPhase}
      submitVoteAction={submitVoteAction}
      resetCandidateVotes={resetCandidateVotes}
      changeCurrentVotingPhaseStatusCandidateAction={
        changeCurrentVotingPhaseStatusCandidateAction
      }
      recruiterVotes={recruiterVotes}
      makeVoteDefinitiveAction={makeVoteDefinitiveAction}
      token={token}
      initialCandidateId={initialCandidateId}
      initialApprovedCount={initialApprovedCount}
      initialRejectedCount={initialRejectedCount}
      initialVotedCount={initialVotedCount}
      initialTotalToVote={initialTotalToVote}
      initialFinishedCandidates={initialFinishedCandidates}
    />
  );
}
