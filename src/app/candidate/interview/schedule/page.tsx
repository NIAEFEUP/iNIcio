import SchedulingCalendar from "@/components/scheduling/scheduling-calendar";
import { getInterviewSlots } from "@/lib/recruitment";

export default async function CandidateInterviewSchedule() {
  async function confirm() {
    "use server";

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
