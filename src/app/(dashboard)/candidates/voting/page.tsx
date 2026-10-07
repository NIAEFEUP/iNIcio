"use server";

import { Vote } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  changeCurrentVotingPhaseStatusCandidate,
  deleteCandidateVotes,
  getActiveVotingPhaseId,
  getCurrentVotingPhase,
  getRecruiterVotes,
  getVotingPhaseRecruitmentId,
  getVotingPhases,
  makeCandidateVoteDefinitive,
  voteForCandidate,
} from "@/lib/voting";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import {
  requireAdminSession,
  requireRecruiterSession,
} from "@/lib/action-guard";
import { AdminVotingView } from "@/components/candidate/voting/admin-voting-view";
import { RecruiterVotingView } from "@/components/candidate/voting/recruiter-voting-view";
import { CandidateVotingSessionsList } from "@/components/candidate/voting/candidate-voting-sessions-list";

export default async function CandidatesVotingPage() {
  const session = await getSession();
  const userIsAdmin = session?.user.id ? await isAdmin(session.user.id) : false;

  const targetId = await getTargetRecruitmentId();
  const activeVotingPhaseId = await getActiveVotingPhaseId(targetId);

  // Server actions for voting room
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

  async function changeCurrentVotingPhaseStatusCandidateAction(
    votingPhaseId: number,
    candidateId: string,
  ) {
    "use server";
    await requireAdminSession();
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

  async function resetCandidateVotesAction(
    votingPhaseId: number,
    candidateId: string,
  ) {
    "use server";
    await requireAdminSession();
    await deleteCandidateVotes(votingPhaseId, candidateId);
  }

  // RECRUITER VIEW
  if (!userIsAdmin) {
    if (activeVotingPhaseId) {
      const currentVotingPhase =
        await getCurrentVotingPhase(activeVotingPhaseId);

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

    // No active session for recruiter
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Votações" />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center max-w-md mx-auto space-y-4 my-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <Vote className="size-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-foreground">
              Nenhuma votação a decorrer
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              De momento não existe nenhuma sessão de votação ativa. Quando um
              administrador iniciar uma votação, poderás participar aqui em
              tempo real.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN VIEW
  if (activeVotingPhaseId) {
    const currentVotingPhase = await getCurrentVotingPhase(activeVotingPhaseId);

    if (currentVotingPhase) {
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
  }

  // No active session for admin -> show list of past sessions
  const votingPhases = await getVotingPhases(targetId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Votações" />
      <CandidateVotingSessionsList votingPhases={votingPhases as any} />
    </div>
  );
}
