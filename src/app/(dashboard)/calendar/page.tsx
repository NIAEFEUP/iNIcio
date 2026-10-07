import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { isRecruiter, getAllRecruiters } from "@/lib/recruiter";
import { getTargetRecruitment } from "@/lib/selected-recruitment";
import { getActiveRecruitment } from "@/lib/recruitment";
import { getGlobalScheduleEvents, type TeamRecruiter } from "@/lib/calendar";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Calendar } from "lucide-react";
import { GlobalScheduleCalendar } from "@/components/recruiter/global-schedule-calendar";

export default async function GlobalCalendarPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const targetRecruitment =
    (await getTargetRecruitment()) ?? (await getActiveRecruitment());

  if (!targetRecruitment) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Agenda" />
        <Empty className="border-border">
          <EmptyMedia variant="icon">
            <Calendar className="size-4" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Não existe um recrutamento ativo</EmptyTitle>
            <EmptyDescription>
              De momento não existe um recrutamento selecionado para visualizar
              a agenda global da equipa.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const canAccess =
    (await isRecruiter(session.user.id, targetRecruitment.id)) ||
    (await isAdmin(session.user.id));

  if (!canAccess) {
    redirect("/");
  }

  const [events, enrolledRecruiters] = await Promise.all([
    getGlobalScheduleEvents(targetRecruitment.id),
    getAllRecruiters(targetRecruitment.id),
  ]);

  const recruiters: TeamRecruiter[] = enrolledRecruiters.map((r) => ({
    id: r.user.id,
    name: r.user.name,
    email: r.user.email,
    image: r.user.image,
  }));

  return (
    <GlobalScheduleCalendar
      events={events}
      recruiters={recruiters}
      currentUserId={session.user.id}
    />
  );
}
