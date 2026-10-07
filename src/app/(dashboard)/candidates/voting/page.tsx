"use server";

import { PageHeader } from "@/components/layout/page-header";
import {
  getActiveVotingPhaseId,
  getCurrentVotingPhase,
  getRecruiterVotes,
  getVotingPhaseRecruitmentId,
  getVotingPhases,
  voteForCandidate,
} from "@/lib/voting";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { requireRecruiterSession } from "@/lib/action-guard";
import { RecruiterVotingView } from "@/components/candidate/voting/recruiter-voting-view";
import { CandidateVotingSessionsList } from "@/components/candidate/voting/candidate-voting-sessions-list";

export default async function CandidatesVotingPage() {
  const session = await getSession();
  const userIsAdmin = Boolean(
    session?.user.id ? await isAdmin(session.user.id) : false,
  );

  const targetId = await getTargetRecruitmentId();
  const activeVotingPhaseId = await getActiveVotingPhaseId(targetId);

  // Server action for recruiter voting in live room
  async function submitVoteAction(
    recruiterId: string,
    candidateId: string,
    decision: "approve" | "reject",
  ) {
    "use server";
    if (!activeVotingPhaseId) return false;

    const recruitmentId =
      await getVotingPhaseRecruitmentId(activeVotingPhaseId);
    if (!recruitmentId) throw new Error("Voting phase not found");

    const user = await requireRecruiterSession(recruitmentId);
    const effectiveRecruiterId = user.id;

    const recruiterVotes = await getRecruiterVotes(
      activeVotingPhaseId,
      effectiveRecruiterId,
    );

    if (!recruiterVotes.find((v) => v.candidateId === candidateId)) {
      return await voteForCandidate(
        activeVotingPhaseId,
        effectiveRecruiterId,
        candidateId,
        decision,
      );
    }

    return false;
  }

  // RECRUITER: If active session exists, immediately show recruiter live room
  if (!userIsAdmin && activeVotingPhaseId) {
    const currentVotingPhase = await getCurrentVotingPhase(activeVotingPhaseId);

    if (currentVotingPhase) {
      const recruiterVotes = session?.user.id
        ? await getRecruiterVotes(currentVotingPhase.id, session.user.id)
        : [];

      return (
        <div className="flex flex-col gap-4">
          <PageHeader title="Votação" />
          <RecruiterVotingView
            currentVotingPhase={currentVotingPhase as any}
            recruiterVotes={recruiterVotes}
            submitVoteAction={submitVoteAction}
            currentUserId={session?.user.id || ""}
          />
        </div>
      );
    }
  }

  // Fetch list of voting sessions
  const votingPhases = await getVotingPhases(targetId);

  // ADMIN (always sees list page) or RECRUITER when no active session
  return (
    <CandidateVotingSessionsList
      votingPhases={votingPhases as any}
      isAdmin={userIsAdmin}
    />
  );
}
