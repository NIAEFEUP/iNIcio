import AdminResources from "@/components/admin/admin-resources";
import RecruitmentSelector from "@/components/admin/recruitment-selector";
import { getAllCandidateUsers } from "@/lib/db";
import { getAllRecruiters } from "@/lib/recruiter";
import { getActiveRecruitment, getRecruitments } from "@/lib/recruitment";

import CandidatesMailTo from "@/components/admin/candidates-mailto";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface AdminPageProps {
  searchParams: Promise<{ recruitmentId?: string | string[] }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const recruitments = await getRecruitments();

  let recruitmentId = (await getActiveRecruitment())?.id;
  if (params.recruitmentId !== undefined) {
    const parsed = Number.parseInt(String(params.recruitmentId), 10);

    if (Number.isInteger(parsed) && parsed > 0) {
      recruitmentId = parsed;
    }
  }

  const recruiters = recruitmentId ? await getAllRecruiters(recruitmentId) : [];
  const candidates = recruitmentId
    ? await getAllCandidateUsers(recruitmentId)
    : [];

  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex flex-col gap-y-16">
      <h1 className="text-center text-4xl font-bold">AdminUI - Recrutamento</h1>

      <div className="mx-16 md:mx-64 flex flex-col gap-4">
        <div className="flex flex-row flex-wrap items-center w-full justify-between gap-2">
          <h2 className="font-bold">Gestão</h2>
          <div className="flex flex-row flex-wrap items-center gap-2">
            <RecruitmentSelector
              recruitments={recruitments}
              selectedId={recruitmentId}
            />
            <CandidatesMailTo
              emails={candidates.map((candidate) => candidate.email)}
            />
          </div>
        </div>

        <AdminResources
          recruiters={recruiters}
          candidates={candidates}
          userId={session!.user.id}
        />
      </div>
    </div>
  );
}
