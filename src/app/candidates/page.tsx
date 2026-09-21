import CandidatesPageClient from "@/components/candidates/candidates-page-client";
import { CANDIDATES_VIEW_MODE_COOKIE_NAME } from "@/constants/cookies.const";
import { cookies } from "next/headers";

export default async function CandidatesPage() {
  const initialViewMode =
    (await cookies()).get(CANDIDATES_VIEW_MODE_COOKIE_NAME)?.value === "list"
      ? "list"
      : "grid";

  return <CandidatesPageClient initialViewMode={initialViewMode} />;
}
