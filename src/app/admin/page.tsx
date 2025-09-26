import AdminResources from "@/components/admin/admin-resources";
import { candidate, recruiter } from "@/db/schema";
import { db } from "@/lib/db";

export default async function AdminPage() {
  const recruiters = await db.select().from(recruiter);
  const candidates = await db.select().from(candidate);

  return (
    <div className="flex flex-col gap-y-16">
      <h1 className="text-center text-4xl font-bold">AdminUI - Recrutamento</h1>

      <div className="mx-16 md:mx-64 flex flex-col gap-4">
        <h2 className="font-bold">Gestão</h2>

        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
          <AdminResources recruiters={recruiters} candidates={candidates} />
        </div>
      </div>
    </div>
  );
}
