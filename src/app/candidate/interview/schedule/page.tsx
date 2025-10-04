import SchedulingCalendar from "@/components/scheduling/scheduling-calendar";
import { auth } from "@/lib/auth";
import getCandidateWithInterviewAndDynamic from "@/lib/candidate";
import { Slot } from "@/lib/db";
import addInterviewWithSlot from "@/lib/interview";
import { getInterviewSlots } from "@/lib/recruitment";
import { headers } from "next/headers";

export default async function CandidateInterviewSchedule() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  async function confirm(slots: Array<Slot>) {
    "use server";

    if (!session?.user.id) return false;

    for (const slot of slots) {
      await addInterviewWithSlot(session.user.id, slot);
    }

    return true;
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
