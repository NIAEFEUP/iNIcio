import { CandidateVotingSlideshow } from "@/components/candidate/voting/candidate-voting-slideshow";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { getAllCandidatesWithDynamic } from "@/lib/dynamic";
import {
  changeCurrentVotingPhaseStatusCandidate,
  createVotingPhase,
  getCurrentVotingPhase,
  getRecruiterVotes,
  voteForCandidate,
} from "@/lib/voting";
import { headers } from "next/headers";

export default async function CandidateVotingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  async function createVotingPhaseAction() {
    "use server";

    return await createVotingPhase(new Date().getFullYear());
  }

  async function submitVoteAction(
    votingPhaseId: number,
    recruiterId: string,
    candidateId: string,
    decision: "approve" | "reject",
  ) {
    "use server";

    const recruiterVotes = await getRecruiterVotes(votingPhaseId, recruiterId);

    if (!recruiterVotes.find((v) => v.candidateId === candidateId)) {
      return await voteForCandidate(
        votingPhaseId,
        recruiterId,
        candidateId,
        decision,
      );
    }

    return false;
  }

  async function changeCurrentVotingPhaseStatusCandidateAction(
    votingPhaseId: number,
    candidateId: string,
  ) {
    "use server";

    return await changeCurrentVotingPhaseStatusCandidate(
      votingPhaseId,
      candidateId,
    );
  }

  const candidates = await getAllCandidatesWithDynamic();
  const admin = await isAdmin(session?.user.id);

  const currentVotingPhase = await getCurrentVotingPhase(
    new Date().getFullYear(),
  );

  const recruiterVotes = await getRecruiterVotes(
    currentVotingPhase?.id,
    session?.user.id,
  );

  return (
    <CandidateVotingSlideshow
      candidates={candidates}
      admin={admin ? true : false}
      currentVotingPhase={currentVotingPhase}
      createVotingPhaseAction={createVotingPhaseAction}
      submitVoteAction={submitVoteAction}
      changeCurrentVotingPhaseStatusCandidateAction={
        changeCurrentVotingPhaseStatusCandidateAction
      }
      recruiterVotes={recruiterVotes}
    />
  );
}
