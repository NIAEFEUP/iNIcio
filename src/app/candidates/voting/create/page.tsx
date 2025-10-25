"use server";

import { getAllCandidatesWithDynamic } from "@/lib/dynamic";
import CandidatesClient from "@/components/candidates/candidates-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAllPossibleApplicationInterests } from "@/lib/application";
import CandidateVotingChoiceClient from "@/components/candidate/voting/candidates-voting-client";

export default async function CandidateVotingCreatePage() {
  const candidates = await getAllCandidatesWithDynamic();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
    />
  );
}
