import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Calendar } from "lucide-react";
import SlotAdminCalendar from "@/components/admin/slot-admin-calendar";

import { getLatestRecruitment } from "@/lib/recruitment";
import { getTargetRecruitment } from "@/lib/selected-recruitment";
import { db, NewSlot, Slot } from "@/lib/db";

import { slot } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import getExistingSlots from "@/lib/slot";
import { getBookings } from "@/lib/booking";
import { getAllCandidatesWithDynamic } from "@/lib/dynamic";
import { requireAdminSession } from "@/lib/action-guard";

export type SlotOperation = {
  type: "add" | "remove";
  slot: Slot | NewSlot;
};

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

export default async function SlotsPage() {
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
    }
  };

  const existingSlots = await getExistingSlots(currentRecruitment?.id);
  const bookings = await getBookings(currentRecruitment?.id);
  const candidates = await getAllCandidatesWithDynamic(currentRecruitment?.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gestão de slots" />

      {currentRecruitment && (
        <>
          <SlotAdminCalendar
            candidates={candidates}
            bookings={bookings}
            recruitmentId={currentRecruitment.id}
            existingSlots={existingSlots}
            saveSlots={saveSlots}
          />
        </>
      )}

      {!currentRecruitment && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Não existe nenhum período de recrutamento ativo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
