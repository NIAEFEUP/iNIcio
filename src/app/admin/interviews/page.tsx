import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import SlotAdminCalendar from "@/components/admin/slot-admin-calendar";

import { getLatestRecruitment } from "@/lib/recruitment";
import { db, Slot } from "@/lib/db";

import { slot } from "@/db/schema";
import { eq } from "drizzle-orm";
import getExistingSlots from "@/lib/slot";

export type SlotOperation = {
  type: "add" | "remove";
  slot: Slot;
};

export default async function SlotsPage() {
  const saveSlots = async (slots: SlotOperation[]) => {
    "use server";

    for (const s of slots) {
      if (s.type === "add") {
        await db.insert(slot).values(s.slot);
      } else {
        await db.delete(slot).where(eq(slot.id, s.slot.id));
      }
    }
  };

  const latestRecruitment = await getLatestRecruitment();

  const existingSlots = await getExistingSlots(latestRecruitment?.year);

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
          <SlotAdminCalendar
            recruitmentYear={latestRecruitment.year}
            existingSlots={existingSlots}
            saveSlots={saveSlots}
          />
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
