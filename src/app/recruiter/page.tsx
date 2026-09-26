import RecruiterResources from "@/components/recruiter/recruiter-resources";
import { PageHeader } from "@/components/layout/page-header";
import { getSession } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { redirect } from "next/navigation";

export default async function RecruiterPage() {
  const session = await getSession();

  const targetId = await getTargetRecruitmentId();

  if (!(await isRecruiter(session?.user.id, targetId))) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Painel do Recrutador" />

      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">
          Recursos de Recrutamento
        </h2>
        <RecruiterResources userId={session!.user.id} />
      </div>
    </div>
  );
}
