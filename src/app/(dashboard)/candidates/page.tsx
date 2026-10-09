import type { ColumnFiltersState } from "@tanstack/react-table";
import CandidatesPageClient from "@/components/candidates/candidates-page-client";
import { CANDIDATES_VIEW_MODE_COOKIE_NAME } from "@/constants/cookies.const";
import { loadCandidates } from "@/app/candidate/actions";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { cookies } from "next/headers";

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    course?: string;
    year?: string;
    previousApplications?: string;
    departments?: string;
    interviewClassification?: string;
    dynamicClassification?: string;
    decision?: string;
    scheduling?: string;
  }>;
}) {
  const cookieStore = await cookies();
  const initialViewMode =
    cookieStore.get(CANDIDATES_VIEW_MODE_COOKIE_NAME)?.value === "list"
      ? "list"
      : "grid";

  const params = await searchParams;
  const parseParam = (val?: string) =>
    val
      ? val
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

  const initialScheduling = parseParam(params.scheduling);

  const initialFilters: ColumnFiltersState = [
    { id: "course", value: parseParam(params.course) },
    { id: "year", value: parseParam(params.year) },
    {
      id: "previousApplications",
      value: parseParam(params.previousApplications),
    },
    { id: "departments", value: parseParam(params.departments) },
    {
      id: "interviewClassification",
      value: parseParam(params.interviewClassification),
    },
    {
      id: "dynamicClassification",
      value: parseParam(params.dynamicClassification),
    },
    { id: "decision", value: parseParam(params.decision) },
    { id: "scheduling", value: initialScheduling },
  ].filter((f) => (f.value as string[]).length > 0);

  const [initialData, session] = await Promise.all([
    loadCandidates(),
    getSession(),
  ]);

  const userIsAdmin = session?.user?.id
    ? await isAdmin(session.user.id)
    : false;
  const initialAuthUser = session?.user
    ? { id: session.user.id, isAdmin: Boolean(userIsAdmin) }
    : null;

  return (
    <CandidatesPageClient
      initialData={initialData}
      initialViewMode={initialViewMode}
      initialScheduling={initialScheduling}
      initialFilters={initialFilters}
      initialAuthUser={initialAuthUser}
    />
  );
}
