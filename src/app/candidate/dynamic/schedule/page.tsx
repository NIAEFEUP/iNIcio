import SchedulingCalendar from "@/components/scheduling/scheduling-calendar";

export default async function CandidateDynamicSchedule() {
  async function confirm() {
    "use server";

    return true;
  }

  return (
    <>
      <h1 className="text-4xl text-center font-bold">Agenda a tua dinâmica</h1>

      <SchedulingCalendar
        confirmAction={confirm}
        slots={[
          {
            id: 1,
            start: new Date("2024-09-19T01:00:00.000Z"),
            duration: 30,
          },
          {
            id: 2,
            start: new Date("2024-09-20T10:00:00.000Z"),
            duration: 30,
          },
          {
            id: 3,
            start: new Date("2024-09-20T16:00:00.000Z"),
            duration: 30,
          },
          {
            id: 4,
            start: new Date("2024-09-20T16:00:00.000Z"),
            duration: 30,
          },
          {
            id: 5,
            start: new Date("2024-09-20T16:00:00.000Z"),
            duration: 30,
          },
          {
            id: 6,
            start: new Date("2024-09-21T16:00:00.000Z"),
            duration: 30,
          },
          {
            id: 7,
            start: new Date("2024-09-22T15:00:00.000Z"),
            duration: 30,
          },
          {
            id: 8,
            start: new Date("2024-09-23T13:00:00.000Z"),
            duration: 30,
          },
        ]}
      />
    </>
  );
}
