import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import SlotAdminCalendar from "@/components/admin/slot-admin-calendar";

import { getLatestRecruitment } from "@/lib/recruitment";
import { db, Slot } from "@/lib/db";

import { slot } from "@/db/schema";

export default async function SlotsPage() {
  const saveSlots = async (slots: Slot[]) => {
    "use server";

    await db.transaction(async (trx) => {
      for (const s of slots) {
        await trx.insert(slot).values(s);
      }
    });
  };

  const latestRecruitment = await getLatestRecruitment();

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
