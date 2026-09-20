import SchedulingCalendar from "@/components/scheduling/scheduling-calendar";
import { auth } from "@/lib/auth";
import getCandidateWithInterviewAndDynamic from "@/lib/candidate";
import { Slot } from "@/lib/db";
import addInterviewWithSlot from "@/lib/interview";
import {
  getInterviewSlots,
  markInterviewRecruitmentPhaseAsDone,
} from "@/lib/recruitment";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/action-guard";

export default async function CandidateInterviewSchedule() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  async function confirm(slots: Array<Slot>) {
    "use server";

    const user = await getSessionUser();

    if (!slots || !Array.isArray(slots) || slots.length === 0) return false;

    try {
      for (const slot of slots.slice(0, 1)) {
        await addInterviewWithSlot(user.id, slot);
        await markInterviewRecruitmentPhaseAsDone(user.id);
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  const candidate = await getCandidateWithInterviewAndDynamic(session?.user.id);

  const slots = await getInterviewSlots();

  return (
    <>
      <h1 className="text-4xl text-center font-bold">
        Agenda a tua entrevista
      </h1>

      <SchedulingCalendar
        confirmAction={confirm}
        slots={slots}
        confirmUrl="/candidate/progress"
        chosenSlot={candidate?.interview?.slot}
      />
    </>
  );
}
