import { getRecruiterAgendaEvents } from "@/lib/calendar";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RecruiterAgendaCalendar } from "@/components/recruiter/recruiter-agenda-calendar";

export default async function CalendarIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const targetId = await getTargetRecruitmentId();

  const [events, targetUser] = await Promise.all([
    getRecruiterAgendaEvents(id, targetId),
    db.query.user.findFirst({
      where: eq(user.id, id),
    }),
  ]);

  const isOwnAgenda = session?.user.id === id;
  const recruiterName = targetUser?.name || "Recrutador";

  return (
    <RecruiterAgendaCalendar
      events={events}
      recruiterName={recruiterName}
      isOwnAgenda={isOwnAgenda}
    />
  );
}
