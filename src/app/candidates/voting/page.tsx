"use server";

import CandidateVotingPhaseCard from "@/components/candidate/voting/candidate-voting-phase-card";
import CandidateVotingStartButton from "@/components/candidate/voting/candidate-voting-start-button";
import { PageHeader } from "@/components/layout/page-header";
import { getVotingPhases } from "@/lib/voting";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/admin";

export default async function CandidatesVotingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const admin = await isAdmin(session?.user.id);

  const targetId = await getTargetRecruitmentId();
  const votingPhases = await getVotingPhases(targetId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Votações"
        actions={admin ? <CandidateVotingStartButton /> : undefined}
      />

      {votingPhases?.map((vp) => (
        <CandidateVotingPhaseCard key={vp.id} votingPhase={vp} />
      ))}

      {votingPhases?.length === 0 && (
        <p className="text-center">Nenhuma votação encontrada</p>
      )}
    </div>
  );
}
