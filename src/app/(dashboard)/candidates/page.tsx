import CandidatesPageClient from "@/components/candidates/candidates-page-client";
import { CANDIDATES_VIEW_MODE_COOKIE_NAME } from "@/constants/cookies.const";
import { loadCandidates } from "@/app/candidate/actions";
import { cookies } from "next/headers";

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ scheduling?: string }>;
}) {
  const cookieStore = await cookies();
  const initialViewMode =
    cookieStore.get(CANDIDATES_VIEW_MODE_COOKIE_NAME)?.value === "list"
      ? "list"
      : "grid";

  const { scheduling } = await searchParams;
  const initialScheduling = scheduling
    ? scheduling
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const initialData = await loadCandidates();

  return (
    <CandidatesPageClient
      initialData={initialData}
      initialViewMode={initialViewMode}
      initialScheduling={initialScheduling}
    />
  );
}
