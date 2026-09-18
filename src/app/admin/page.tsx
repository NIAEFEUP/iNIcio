import AdminResources from "@/components/admin/admin-resources";
import { getAllCandidateUsers } from "@/lib/db";
import { getAllRecruiters } from "@/lib/recruiter";
import { getActiveRecruitment } from "@/lib/recruitment";

import CandidatesMailTo from "@/components/admin/candidates-mailto";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AdminPage() {
  const recruitmentId = (await getActiveRecruitment())?.id;

  const recruiters = recruitmentId ? await getAllRecruiters(recruitmentId) : [];
  const candidates = recruitmentId
    ? await getAllCandidateUsers(recruitmentId)
    : [];

  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex flex-col gap-y-16">
      <h1 className="text-center text-4xl font-bold">AdminUI - Recrutamento</h1>

      <div className="mx-16 md:mx-64 flex flex-col gap-4">
        <div className="flex flex-row w-full justify-between">
          <h2 className="font-bold">Gestão</h2>
          <CandidatesMailTo
            emails={candidates.map((candidate) => candidate.email)}
          />
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
