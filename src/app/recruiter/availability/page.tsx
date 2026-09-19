import RecruiterAvailabilityClient, {
  AvailabilityOperation,
} from "@/components/recruiter/recruiter-availability-progress";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { recruiterAvailability } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addAvailability,
  getAvailabilities,
  isRecruiter,
  removeAvailability,
} from "@/lib/recruiter";
import { and, eq } from "drizzle-orm";
import { Calendar } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getTargetRecruitment } from "@/lib/selected-recruitment";
import { requireRecruiterSession } from "@/lib/action-guard";

export default async function RecruiterAvailabilityPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
          const existing = await tx
            .select()
            .from(recruiterAvailability)
            .where(
              and(
                eq(recruiterAvailability.start, sanitizedAvailability.start),
                eq(
                  recruiterAvailability.recruitmentId,
                  sanitizedAvailability.recruitmentId,
                ),
                eq(
                  recruiterAvailability.duration,
                  sanitizedAvailability.duration,
                ),
                eq(
                  recruiterAvailability.recruiterId,
                  sanitizedAvailability.recruiterId,
                ),
              ),
            );

          if (existing.length === 0)
            await addAvailability(sanitizedAvailability);
        } else {
          await removeAvailability(sanitizedAvailability);
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
