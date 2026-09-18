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
  removeAvailability,
} from "@/lib/recruiter";
import { and, eq } from "drizzle-orm";
import { Calendar } from "lucide-react";
import { headers } from "next/headers";

import { getTargetRecruitment } from "@/lib/selected-recruitment";

export default async function RecruiterAvailabilityPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const targetRecruitment = await getTargetRecruitment();

  async function confirm(availabilityOperations: AvailabilityOperation[]) {
    "use server";

    await db.transaction(async (tx) => {
      for (const operation of availabilityOperations) {
        if (operation.type === "add") {
          const existing = await tx
            .select()
            .from(recruiterAvailability)
            .where(
              and(
                eq(recruiterAvailability.start, operation.availability.start),
                eq(
                  recruiterAvailability.recruitmentId,
                  operation.availability.recruitmentId,
                ),
                eq(
                  recruiterAvailability.duration,
                  operation.availability.duration,
                ),
                eq(
                  recruiterAvailability.recruiterId,
                  operation.availability.recruiterId,
                ),
              ),
            );

          if (existing.length === 0)
            await addAvailability(operation.availability);
        } else {
          await removeAvailability(operation.availability);
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
