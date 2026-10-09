import { revalidatePath } from "next/cache";
import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Calendar } from "lucide-react";
import SlotAdminCalendar, {
  type SlotOperation,
} from "@/components/admin/slot-admin-calendar";

import { getLatestRecruitment } from "@/lib/recruitment";
import { getTargetRecruitment } from "@/lib/selected-recruitment";
import { db } from "@/lib/db";

import { slot } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import getExistingSlots from "@/lib/slot";
import { getBookings } from "@/lib/booking";
import { getCandidateSchedulingStats } from "@/lib/candidate";
import { requireAdminSession } from "@/lib/action-guard";

const reconcileOperations = (operations: SlotOperation[]): SlotOperation[] => {
  const opMap = new Map<string, SlotOperation>();

  for (const op of operations) {
    const key = `${op.slot.type}-${op.slot.start.getTime()}`;

    if (!opMap.has(key)) {
      opMap.set(key, op);
    } else {
      const existing = opMap.get(key)!;

      if (
        (existing.type === "add" && op.type === "remove") ||
        (existing.type === "remove" && op.type === "add")
      ) {
        opMap.delete(key);
      } else {
        opMap.set(key, op);
      }
    }
  }

  return Array.from(opMap.values());
};

export default async function SlotsAdminPage() {
  const currentRecruitment =
    (await getTargetRecruitment()) ?? (await getLatestRecruitment());

  const saveSlots = async (slots: SlotOperation[]) => {
    "use server";
    await requireAdminSession();

    if (currentRecruitment) {
      const reconciled = reconcileOperations(slots);

      await db.transaction(async (tx) => {
        for (const s of reconciled) {
          if (s.type === "add") {
            const existing = await tx
              .select()
              .from(slot)
              .where(
                and(
                  eq(slot.start, s.slot.start),
                  eq(slot.type, s.slot.type),
                  eq(slot.recruitmentId, currentRecruitment.id),
                  eq(slot.duration, s.slot.duration),
                ),
              );

            if (existing.length === 0) {
              await tx.insert(slot).values({
                start: s.slot.start,
                duration: s.slot.duration,
                quantity: s.slot.quantity,
                type: s.slot.type,
                recruitmentId: currentRecruitment.id,
              });
            }
          } else if (s.slot.id !== undefined) {
            await tx
              .delete(slot)
              .where(
                and(
                  eq(slot.id, s.slot.id),
                  eq(slot.recruitmentId, currentRecruitment.id),
                ),
              );
          }
        }
      });

      revalidatePath("/admin/slots");
      revalidatePath("/admin/bookings");
      revalidatePath("/candidate/progress");
    }

    return getExistingSlots(currentRecruitment?.id);
  };

  if (!currentRecruitment) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Gestão de horários & slots" />
        <Empty className="border-border">
          <EmptyMedia variant="icon">
            <Calendar className="size-4" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Não existe um recrutamento ativo</EmptyTitle>
            <EmptyDescription>
              De momento não existe um recrutamento selecionado para gerir
              horários e slots.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const [existingSlots, bookings, candidateStats] = await Promise.all([
    getExistingSlots(currentRecruitment.id),
    getBookings(currentRecruitment.id),
    getCandidateSchedulingStats(currentRecruitment.id),
  ]);

  return (
    <SlotAdminCalendar
      candidateStats={candidateStats}
      bookings={bookings}
      recruitmentId={currentRecruitment.id}
      existingSlots={existingSlots}
      saveSlots={saveSlots}
    />
  );
}
