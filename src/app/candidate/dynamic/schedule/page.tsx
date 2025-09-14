import SchedulingCalendar from "@/components/scheduling/scheduling-calendar";
import { getDynamicSlots, isRecruitmentPhaseDone } from "@/lib/recruitment";

export default async function CandidateDynamicSchedule() {
  async function confirm() {
    "use server";

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
