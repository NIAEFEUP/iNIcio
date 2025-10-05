import SchedulingCalendar from "@/components/scheduling/scheduling-calendar";
import { auth } from "@/lib/auth";
import getCandidateWithInterviewAndDynamic from "@/lib/candidate";
import { Slot } from "@/lib/db";
import { tryToAddCandidateToDynamic } from "@/lib/dynamic";
import {
  getDynamicSlots,
  markDynamicRecruitmentPhaseAsDone,
} from "@/lib/recruitment";
import { headers } from "next/headers";

export default async function CandidateDynamicSchedule() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  async function confirm(slots: Array<Slot>) {
    "use server";

    if (!session?.user.id) return false;

    for (const slot of slots) {
      await tryToAddCandidateToDynamic(session.user.id, slot);
      await markDynamicRecruitmentPhaseAsDone(session.user.id);
    }

    return true;
  }

  const candidate = await getCandidateWithInterviewAndDynamic(session?.user.id);

  const slots = await getDynamicSlots();

  return (
    <>
      <h1 className="text-4xl text-center font-bold">Agenda a tua dinâmica</h1>

      <SchedulingCalendar
        confirmAction={confirm}
        slots={slots}
        confirmUrl="/candidate/progress"
        chosenSlot={candidate?.dynamic?.dynamic.slot}
      />
    </>
  );
}
