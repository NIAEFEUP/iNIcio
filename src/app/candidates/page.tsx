import CandidatesClient from "@/components/candidates/candidates-client";
import { getAllPossibleApplicationInterests } from "@/lib/application";
import { auth } from "@/lib/auth";
import { getAllCandidatesWithDynamic } from "@/lib/dynamic";
import { headers } from "next/headers";

export default async function Friends() {
  const candidates = await getAllCandidatesWithDynamic();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <CandidatesClient
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
