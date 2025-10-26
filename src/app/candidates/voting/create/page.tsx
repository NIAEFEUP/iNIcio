"use server";

import { getAllCandidatesWithDynamic } from "@/lib/dynamic";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAllPossibleApplicationInterests } from "@/lib/application";
import CandidateVotingChoiceClient from "@/components/candidate/voting/candidates-voting-client";
import { createVotingPhase } from "@/lib/voting";
import {
  CandidateFilterRestriction,
  CandidateWithMetadata,
} from "@/lib/candidate";

export default async function CandidateVotingCreatePage() {
  const candidates = await getAllCandidatesWithDynamic([
    CandidateFilterRestriction.ONLY_WITH_INTERVIEW_AND_DYNAMIC,
  ]);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  async function handleCandidateSelection(
    candidates: Array<CandidateWithMetadata>,
  ) {
    "use server";

    return await createVotingPhase(candidates, new Date().getFullYear());
  }

  return (
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
  );
}
