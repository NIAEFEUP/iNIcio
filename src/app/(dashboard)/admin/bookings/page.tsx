import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Calendar } from "lucide-react";
import BookingManagementClient from "@/components/admin/booking-management-client";

import { getLatestRecruitment } from "@/lib/recruitment";
import { getTargetRecruitment } from "@/lib/selected-recruitment";
import getExistingSlots from "@/lib/slot";
import { getBookings } from "@/lib/booking";
import { getCandidateSchedulingStats } from "@/lib/candidate";

export default async function BookingsAdminPage() {
  const currentRecruitment =
    (await getTargetRecruitment()) ?? (await getLatestRecruitment());

  if (!currentRecruitment) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Marcações" />
        <Empty className="border-border">
          <EmptyMedia variant="icon">
            <Calendar className="size-4" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Não existe um recrutamento ativo</EmptyTitle>
            <EmptyDescription>
              De momento não existe um recrutamento selecionado para visualizar
              marcações e gerir recrutadores.
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
    <BookingManagementClient
      candidateStats={candidateStats}
      bookings={bookings}
      recruitmentId={currentRecruitment.id}
      existingSlots={existingSlots}
    />
  );
}
