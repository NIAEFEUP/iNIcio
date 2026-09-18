import AdminResources from "@/components/admin/admin-resources";
import { recruiter } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { db, getAllCandidateUsers } from "@/lib/db";
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

  const recruiters = await db.select().from(recruiter);
  const targetId = await getTargetRecruitmentId();
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
