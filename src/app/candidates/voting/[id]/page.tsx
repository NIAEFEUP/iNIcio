import { CandidateVotingSlideshow } from "@/components/candidate/voting/candidate-voting-slideshow";
import { PageHeader } from "@/components/layout/page-header";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import {
  changeCurrentVotingPhaseStatusCandidate,
  getCurrentVotingPhase,
  getRecruiterVotes,
  voteForCandidate,
} from "@/lib/voting";
import { headers } from "next/headers";
import { makeCandidateVoteDefinitive } from "@/lib/voting";
import { deleteCandidateVotes } from "@/lib/voting";
import { redirect } from "next/navigation";
import {
  requireAdminSession,
  requireRecruiterSession,
} from "@/lib/action-guard";

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

    const user = await requireRecruiterSession();
    const effectiveRecruiterId = user.id;

    const recruiterVotes = await getRecruiterVotes(id, effectiveRecruiterId);

    if (!recruiterVotes.find((v) => v.candidateId === candidateId)) {
      return await voteForCandidate(
        id,
        effectiveRecruiterId,
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
    await requireRecruiterSession();

    return await changeCurrentVotingPhaseStatusCandidate(
      votingPhaseId,
      candidateId,
    );
  }

  async function makeVoteDefinitiveAction(
    decision: "accept" | "reject",
    votingPhaseId: number,
    candidateId: string,
  ) {
    "use server";
    await requireAdminSession();

    return await makeCandidateVoteDefinitive(
      decision,
      votingPhaseId,
      candidateId,
    );
  }

  async function resetCandidateVotes(
    votingPhaseId: number,
    candidateId: string,
  ) {
    "use server";
    await requireAdminSession();

    await deleteCandidateVotes(votingPhaseId, candidateId);
  }

  const admin = await isAdmin(session?.user.id);

  const currentVotingPhase = await getCurrentVotingPhase(id);
  if (!currentVotingPhase) redirect("/candidates");

  const recruiterVotes = await getRecruiterVotes(
    currentVotingPhase.id,
    session?.user.id,
  );

  return (
    <>
      <PageHeader title="Votação" backHref="/candidates/voting" />
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
      />
    </>
  );
}
