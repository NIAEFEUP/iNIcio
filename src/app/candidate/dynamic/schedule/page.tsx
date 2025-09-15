import SchedulingCalendar from "@/components/scheduling/scheduling-calendar";
import { auth } from "@/lib/auth";
import { Slot } from "@/lib/db";
import { getDynamicSlots, isRecruitmentPhaseDone } from "@/lib/recruitment";
import { headers } from "next/headers";

export default async function CandidateDynamicSchedule() {
  async function confirm(slots: Array<Slot>) {
    "use server";

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user.id) return false;

    return true;
  }

  const slots = await getDynamicSlots();

  return (
    <>
      <h1 className="text-4xl text-center font-bold">Agenda a tua dinâmica</h1>

      <SchedulingCalendar confirmAction={confirm} slots={slots} />
    </>
  );
}
