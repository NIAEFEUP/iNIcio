import AdminResources from "@/components/admin/admin-resources";
import { isAdmin } from "@/lib/admin";
import { getAllCandidateUsers } from "@/lib/db";
import { getRecruiters } from "@/lib/recruitment";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";

import CandidatesMailTo from "@/components/admin/candidates-mailto";
import { PageHeader } from "@/components/layout/page-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!(await isAdmin(session?.user.id))) {
    redirect("/");
  }

  const targetId = await getTargetRecruitmentId();
  const recruiters = await getRecruiters(targetId);
  const candidates = await getAllCandidateUsers(targetId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel de Administração"
        actions={
          <CandidatesMailTo
            emails={candidates.map((candidate) => candidate.email)}
          />
        }
      />

      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">
          Recursos de Gestão
        </h2>
        <AdminResources
          recruiters={recruiters}
          candidates={candidates}
          userId={session!.user.id}
        />
      </div>
    </div>
  );
}
