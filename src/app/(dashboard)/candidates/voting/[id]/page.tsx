import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import { getVotingRoomToken } from "@/lib/voting-room";
import {
  changeCurrentVotingPhaseStatusCandidate,
  deleteCandidateVotes,
  getCandidateVotes,
  getCurrentVotingPhase,
  getPhaseVoterParticipation,
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
  notifyClients,
} from "@/lib/voting-events";
import { AdminVotingView } from "@/components/candidate/voting/admin-voting-view";
import { RecruiterVotingView } from "@/components/candidate/voting/recruiter-voting-view";
import { getCandidateFacilitators } from "@/lib/voting-facilitators";
import { getRecruiters } from "@/lib/recruiter";

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

  const wsToken = await getVotingRoomToken(session?.user.id, numId);

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
    await notifyClients(async () => {
      await broadcastVotesReset(votingPhaseId, candidateId);
      // Resetting also un-finishes the candidate and adjusts the session
      // counters, so clients need the refreshed progress too.
      await broadcastProgress(votingPhaseId);
    });
  }

  if (userIsAdmin) {
    // Seed the admin's counts from the database so the view shows the real
    // numbers even before the websocket delivers a snapshot (or if it cannot
    // connect at all). Recruiters never receive these counts.
    const initialCandidateVotes = currentVotingPhase.status.candidateId
      ? await getCandidateVotes(numId, currentVotingPhase.status.candidateId)
      : [];

    const facilitators = await getCandidateFacilitators(
      currentVotingPhase.candidates,
    );

    const [recruiters, voterIdsByCandidate] = await Promise.all([
      getVotingPhaseRecruitmentId(numId).then((recruitmentId) =>
        recruitmentId ? getRecruiters(recruitmentId) : [],
      ),
      getPhaseVoterParticipation(numId),
    ]);

    return (
      <AdminVotingView
        currentVotingPhase={currentVotingPhase as any}
        changeCurrentVotingPhaseStatusCandidateAction={
          changeCurrentVotingPhaseStatusCandidateAction
        }
        makeVoteDefinitiveAction={makeVoteDefinitiveAction}
        resetCandidateVotesAction={resetCandidateVotesAction}
        token={wsToken}
        initialVoteCounts={{
          approvedCount: initialCandidateVotes.filter(
            (v) => v.decision === "approve",
          ).length,
          rejectedCount: initialCandidateVotes.filter(
            (v) => v.decision === "reject",
          ).length,
          votedCount: initialCandidateVotes.length,
        }}
        facilitators={facilitators}
        votingRecruiters={recruiters}
        voterIdsByCandidate={voterIdsByCandidate}
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
      token={wsToken}
    />
  );
}
