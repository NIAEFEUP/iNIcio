import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import {
  getEventAvailabilities,
  getUsersRecruiters,
} from "@/calendar/requests";
import { ClientContainer } from "@/calendar/components/client-container";
import type { TCalendarView } from "@/calendar/types";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getRole } from "@/lib/role";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";

export default async function AvailabilitiesCalendarShell({
  view,
}: {
  view: TCalendarView;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
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
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-8 py-4">
        <ClientContainer view={view} />
      </div>
    </CalendarProvider>
  );
}
