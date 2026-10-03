import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { getTeamAvailabilitiesData } from "@/lib/calendar";
import { TeamAvailabilityCalendar } from "@/components/admin/team-availability-calendar";

export default async function AdminAvailabilitiesPage() {
  const session = await getSession();
  if (!(await isAdmin(session?.user.id))) {
    redirect("/");
  }

  const targetId = await getTargetRecruitmentId();
  const { availabilities, recruiters } =
    await getTeamAvailabilitiesData(targetId);

  return (
    <TeamAvailabilityCalendar
      availabilities={availabilities}
      recruiters={recruiters}
    />
  );
}
