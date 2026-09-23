import RecruiterAvailabilityClient, {
  AvailabilityOperation,
} from "@/components/recruiter/recruiter-availability-progress";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Marca as tuas disponibilidades" />
      {targetRecruitment ? (
        <RecruiterAvailabilityClient
          currentAvailabilities={currentAvailabilities}
          saveAvailabilities={confirm}
          recruiterId={session?.user.id}
          recruitmentId={targetRecruitment.id}
        />
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Não existe um recrutamento ativo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
