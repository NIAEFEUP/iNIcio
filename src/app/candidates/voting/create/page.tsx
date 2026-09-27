"use server";

import { getAllCandidatesWithDynamic } from "@/lib/dynamic";
import { getSession } from "@/lib/auth";
import { getAllPossibleApplicationInterests } from "@/lib/application";
import CandidateVotingChoiceClient from "@/components/candidate/voting/candidates-voting-client";
import { createVotingPhase } from "@/lib/voting";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { PageHeader } from "@/components/layout/page-header";
import { CandidateFilterRestriction } from "@/lib/candidate";
import { requireAdminSession } from "@/lib/action-guard";

export default async function CandidateVotingCreatePage() {
  const targetId = await getTargetRecruitmentId();
  const candidates = await getAllCandidatesWithDynamic(targetId, [
    CandidateFilterRestriction.ONLY_WITH_INTERVIEW_AND_DYNAMIC,
  ]);

  const session = await getSession();

  async function handleCandidateSelection(selectedCandidates: Array<string>) {
    "use server";

    await requireAdminSession();
    const resolvedTargetId = await getTargetRecruitmentId();

    if (
      !selectedCandidates ||
      !Array.isArray(selectedCandidates) ||
      selectedCandidates.length === 0
    ) {
      throw new Error("Nenhum candidato selecionado");
    }

    const validCandidates = await getAllCandidatesWithDynamic(
      resolvedTargetId,
      [CandidateFilterRestriction.ONLY_WITH_INTERVIEW_AND_DYNAMIC],
    );
    const validCandidateIds = new Set(validCandidates.map((c) => c.id));
    const filtered = selectedCandidates.filter(
      (id) => typeof id === "string" && validCandidateIds.has(id),
    );

    if (filtered.length === 0) {
      throw new Error("Nenhum candidato válido selecionado");
    }

    return await createVotingPhase(filtered, resolvedTargetId);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Criar votação" backHref="/candidates/voting" />
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
