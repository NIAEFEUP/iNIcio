import { CandidateVotingSlideshow } from "@/components/candidate/voting/candidate-voting-slideshow";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import {
  changeCurrentVotingPhaseStatusCandidate,
  getCurrentVotingPhase,
  getRecruiterVotes,
  voteForCandidate,
} from "@/lib/voting";
import { headers } from "next/headers";

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
      return await voteForCandidate(id, recruiterId, candidateId, decision);
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

  const admin = await isAdmin(session?.user.id);

  const currentVotingPhase = await getCurrentVotingPhase(id);

  const recruiterVotes = await getRecruiterVotes(
    currentVotingPhase?.id,
    session?.user.id,
  );

  return (
    <CandidateVotingSlideshow
      candidates={currentVotingPhase.candidates}
      admin={admin ? true : false}
      currentVotingPhase={currentVotingPhase}
      submitVoteAction={submitVoteAction}
      changeCurrentVotingPhaseStatusCandidateAction={
        changeCurrentVotingPhaseStatusCandidateAction
      }
      recruiterVotes={recruiterVotes}
    />
  );
}
