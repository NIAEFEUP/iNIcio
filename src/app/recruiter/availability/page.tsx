import RecruiterAvailabilityClient, {
  AvailabilityOperation,
} from "@/components/recruiter/recruiter-availability-progress";
import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addAvailability,
  getAvailabilities,
  isRecruiter,
  removeAvailability,
} from "@/lib/recruiter";
import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";

import { getTargetRecruitment } from "@/lib/selected-recruitment";
import { requireRecruiterSession } from "@/lib/action-guard";

export default async function RecruiterAvailabilityPage() {
  const session = await getSession();

  const targetRecruitment = await getTargetRecruitment();

  if (
    targetRecruitment &&
    !(await isRecruiter(session?.user.id, targetRecruitment.id))
  ) {
    redirect("/");
  }

  async function confirm(availabilityOperations: AvailabilityOperation[]) {
    "use server";

    const targetRecruitment = await getTargetRecruitment();
    if (!targetRecruitment?.id) {
      throw new Error("No recruitment selected");
    }

    const user = await requireRecruiterSession(targetRecruitment.id);

    await db.transaction(async (tx) => {
      for (const operation of availabilityOperations) {
        const sanitizedAvailability = {
          ...operation.availability,
          recruiterId: user.id,
          recruitmentId: targetRecruitment.id,
        };

        if (operation.type === "add") {
          await addAvailability(sanitizedAvailability, tx);
        } else {
          await removeAvailability(sanitizedAvailability, tx);
        }
      }
    });

    return true;
  }

  const currentAvailabilities = await getAvailabilities(
    session?.user.id,
    targetRecruitment?.id,
  );

  if (!targetRecruitment) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Marca as tuas disponibilidades" />
        <Empty className="border-border">
          <EmptyMedia variant="icon">
            <Calendar className="size-4" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Não existe um recrutamento ativo</EmptyTitle>
            <EmptyDescription>
              De momento não existe um recrutamento selecionado para marcar
              disponibilidades.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <RecruiterAvailabilityClient
      currentAvailabilities={currentAvailabilities}
      saveAvailabilities={confirm}
      recruiterId={session?.user.id ?? ""}
      recruitmentId={targetRecruitment.id}
    />
  );
}
