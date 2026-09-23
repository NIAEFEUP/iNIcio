import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import {
  getEventAvailabilities,
  getUsersRecruiters,
} from "@/calendar/requests";
import { ClientContainer } from "@/calendar/components/client-container";
import { PageHeader } from "@/components/layout/page-header";
import type { TCalendarView } from "@/calendar/types";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getRole } from "@/lib/role";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";

export default async function AvailabilitiesCalendarShell({
  view,
}: {
  view: TCalendarView;
}) {
  const session = await getSession();
  if (!(await isAdmin(session?.user.id))) redirect("/");

  const targetId = await getTargetRecruitmentId();
  const [events, users] = await Promise.all([
    getEventAvailabilities(targetId),
    getUsersRecruiters(targetId),
  ]);

  const role = await getRole(session?.user.id);

  return (
    <CalendarProvider
      users={users}
      events={events}
      authUserRole={role}
      urlId={""}
    >
      <div className="flex flex-col gap-6">
        <PageHeader title="Disponibilidades" />
        <ClientContainer view={view} />
      </div>
    </CalendarProvider>
  );
}
