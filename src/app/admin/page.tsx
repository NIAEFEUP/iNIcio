import AdminResources from "@/components/admin/admin-resources";
import { recruiter } from "@/db/schema";
import { db, getAllCandidateUsers } from "@/lib/db";

import CandidatesMailTo from "@/components/admin/candidates-mailto";
import { PageHeader } from "@/components/layout/page-header";

export default async function AdminPage() {
  const recruiters = await db.select().from(recruiter);
  const candidates = await getAllCandidateUsers();

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
        <AdminResources recruiters={recruiters} candidates={candidates} />
      </div>
    </div>
  );
}
