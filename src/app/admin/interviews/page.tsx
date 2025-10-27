import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import SlotAdminCalendar from "@/components/admin/slot-admin-calendar";

import { getLatestRecruitment } from "@/lib/recruitment";
import { db, NewSlot, Slot } from "@/lib/db";

import { slot } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import getExistingSlots from "@/lib/slot";
import { getBookings } from "@/lib/booking";
import { getAllCandidatesWithDynamic } from "@/lib/dynamic";

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
  const saveSlots = async (slots: SlotOperation[]) => {
    "use server";

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
                eq(slot.recruitmentYear, s.slot.recruitmentYear),
                eq(slot.duration, s.slot.duration),
              ),
            );

          if (existing.length === 0) await tx.insert(slot).values(s.slot);
        } else {
          await tx.delete(slot).where(eq(slot.id, s.slot.id));
        }
      }
    });
  };

  const latestRecruitment = await getLatestRecruitment();
  const existingSlots = await getExistingSlots(latestRecruitment?.year);
  const bookings = await getBookings();
  const candidates = await getAllCandidatesWithDynamic();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gestão de slots
              </h1>
            </div>
          </div>
        </div>

        {latestRecruitment && (
          <>
            <SlotAdminCalendar
              candidates={candidates}
              bookings={bookings}
              recruitmentYear={latestRecruitment.year}
              existingSlots={existingSlots}
              saveSlots={saveSlots}
            />
          </>
        )}

        {!latestRecruitment && (
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
    </div>
  );
}
