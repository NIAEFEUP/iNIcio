import SchedulingCalendar from "@/components/scheduling/scheduling-calendar";
import { auth } from "@/lib/auth";
import { Slot } from "@/lib/db";
import addInterviewWithSlot from "@/lib/interview";
import {
  getInterviewSlots,
  markInterviewRecruitmentPhaseAsDone,
} from "@/lib/recruitment";
import { headers } from "next/headers";

export default async function CandidateInterviewSchedule() {
  async function confirm(slots: Array<Slot>) {
    "use server";

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user.id) return false;

    for (const slot of slots) {
      await addInterviewWithSlot(session.user.id, slot);
      await markInterviewRecruitmentPhaseAsDone(session.user.id);
    }

    return true;
  }

  const slots = await getInterviewSlots();

  return (
    <>
      <h1 className="text-4xl text-center font-bold">
        Agenda a tua entrevista
      </h1>

      <SchedulingCalendar confirmAction={confirm} slots={slots} />
    </>
  );
}
