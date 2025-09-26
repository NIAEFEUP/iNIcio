import CandidatesClient from "@/components/candidates/candidates-client";
import { getAllPossibleApplicationInterests } from "@/lib/application";
import { getAllCandidatesWithDynamic } from "@/lib/dynamic";

export default async function Friends() {
  const candidates = await getAllCandidatesWithDynamic();

  return (
    <CandidatesClient
      candidates={candidates}
      availableDepartments={await getAllPossibleApplicationInterests()}
    />
  );
}
