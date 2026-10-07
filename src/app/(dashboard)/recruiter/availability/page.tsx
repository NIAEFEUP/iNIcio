import RecruiterAvailabilityClient, {
  AvailabilityOperation,
  SaveAvailabilityResult,
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
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { admin, notification, recruiter } from "@/db/schema";
import {
  pruneUnavailableAssignments,
  type RemovedWindow,
} from "@/lib/recruiter-availability";

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

  async function confirm(
    availabilityOperations: AvailabilityOperation[],
  ): Promise<SaveAvailabilityResult> {
    "use server";

    const targetRecruitment = await getTargetRecruitment();
    if (!targetRecruitment?.id) {
      throw new Error("No recruitment selected");
    }
    const targetRecruitmentId = targetRecruitment.id;

    const user = await requireRecruiterSession(targetRecruitmentId);

    const unassigned = await db.transaction(async (tx) => {
      // Lock the recruiter so a concurrent reschedule/assignment cannot race
      // the availability change and the pruning below.
      await tx
        .select({ userId: recruiter.userId })
        .from(recruiter)
        .where(eq(recruiter.userId, user.id))
        .for("update");

      const removedWindows: RemovedWindow[] = [];

      for (const operation of availabilityOperations) {
        const sanitizedAvailability = {
          ...operation.availability,
          recruiterId: user.id,
          recruitmentId: targetRecruitmentId,
        };

        if (operation.type === "add") {
          await addAvailability(sanitizedAvailability, tx);
        } else {
          const deleted = await removeAvailability(sanitizedAvailability, tx);
          if (deleted.length > 0) {
            removedWindows.push({
              start: new Date(sanitizedAvailability.start),
              duration: sanitizedAvailability.duration,
            });
          }
        }
      }

      const sessions = await pruneUnavailableAssignments(
        user.id,
        targetRecruitmentId,
        removedWindows,
        tx,
      );

      if (sessions.length > 0) {
        const admins = await tx.select({ userId: admin.userId }).from(admin);

        if (admins.length > 0) {
          await tx.insert(notification).values(
            admins.map(({ userId }) => ({
              userId,
              type: "interviewer_unassigned",
              data: {
                recruitmentId: targetRecruitmentId,
                recruiterName: user.name,
                count: sessions.length,
                sessions: sessions.map((session) => ({
                  kind: session.kind,
                  slotStart: session.slotStart.toISOString(),
                  candidateNames: session.candidateNames,
                })),
              },
            })),
          );
        }
      }

      return sessions;
    });

    if (unassigned.length > 0) {
      revalidatePath("/admin/bookings");
    }

    return {
      ok: true,
      unassigned: unassigned.map((session) => ({
        kind: session.kind,
        slotStart: session.slotStart.toISOString(),
        candidateNames: session.candidateNames,
      })),
    };
  }

  const currentAvailabilities = await getAvailabilities(
    session?.user.id,
    targetRecruitment?.id,
  );

  if (!targetRecruitment) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Disponibilidade" />
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
