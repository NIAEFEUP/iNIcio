import { Settings } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";

import { CalendarProvider } from "@/calendar/contexts/calendar-context";

import { ChangeBadgeVariantInput } from "@/calendar/components/change-badge-variant-input";
import { ChangeVisibleHoursInput } from "@/calendar/components/change-visible-hours-input";
import { ChangeWorkingHoursInput } from "@/calendar/components/change-working-hours-input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { getEvents, getUsers } from "@/calendar/requests";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getRole } from "@/lib/role";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";

export default async function Layout({
  params,
  children,
}: {
  params: any;
  children: React.ReactNode;
}) {
  const { id } = await params;

  const session = await getSession();
  if (!(await isAdmin(session?.user.id)) && session?.user.id !== id)
    redirect("/");

  const targetId = await getTargetRecruitmentId();
  const [events, users] = await Promise.all([
    getEvents(id, targetId),
    getUsers(),
  ]);

  const role = await getRole(session?.user.id);

  return (
    <DashboardShell>
      <CalendarProvider
        users={users}
        events={events}
        urlId={id}
        authUserRole={role}
      >
        <div className="flex flex-col gap-6">
          {children}

          <Accordion>
            <AccordionItem value="item-1" className="border-none">
              <AccordionTrigger className="flex-none gap-2 py-0 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Settings className="size-4" />
                  <p className="text-base font-semibold">Definições</p>
                </div>
              </AccordionTrigger>

              <AccordionContent>
                <div className="mt-4 flex flex-col gap-6">
                  <ChangeBadgeVariantInput />
                  <ChangeVisibleHoursInput />
                  <ChangeWorkingHoursInput />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CalendarProvider>
    </DashboardShell>
  );
}
