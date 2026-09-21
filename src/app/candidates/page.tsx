import CandidatesClient from "@/components/candidates/candidates-client";
import { CANDIDATES_VIEW_MODE_COOKIE_NAME } from "@/constants/cookies.const";
import { getAllPossibleApplicationInterests } from "@/lib/application";
import { auth } from "@/lib/auth";
import { getAllCandidatesWithDynamic } from "@/lib/dynamic";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { cookies, headers } from "next/headers";

export default async function Friends() {
  const targetId = await getTargetRecruitmentId();
  const candidates = await getAllCandidatesWithDynamic(targetId);

  const initialViewMode =
    (await cookies()).get(CANDIDATES_VIEW_MODE_COOKIE_NAME)?.value === "list"
      ? "list"
      : "grid";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex flex-col gap-6">
      <CandidatesClient
        initialViewMode={initialViewMode}
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
    </div>
  );
}
