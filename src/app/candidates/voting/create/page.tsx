"use server";

import { getAllCandidatesWithDynamic } from "@/lib/dynamic";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAllPossibleApplicationInterests } from "@/lib/application";
import CandidateVotingChoiceClient from "@/components/candidate/voting/candidates-voting-client";
import { createVotingPhase } from "@/lib/voting";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { PageHeader } from "@/components/layout/page-header";
import { CandidateFilterRestriction } from "@/lib/candidate";

export default async function CandidateVotingCreatePage() {
  const targetId = await getTargetRecruitmentId();
  const candidates = await getAllCandidatesWithDynamic(targetId, [
    CandidateFilterRestriction.ONLY_WITH_INTERVIEW_AND_DYNAMIC,
  ]);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  async function handleCandidateSelection(candidates: Array<string>) {
    "use server";

    return await createVotingPhase(candidates, targetId);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Criar votação" />
      <CandidateVotingChoiceClient
        candidates={candidates}
        authUser={
          session
            ? {
                ...session.user,
                image: session.user.image ?? "",
                role: session.user.role as "recruiter" | "candidate" | "admin",
              }
            : undefined
        }
        availableDepartments={await getAllPossibleApplicationInterests()}
        handleCandidateSelection={handleCandidateSelection}
      />
    </div>
  );
}
