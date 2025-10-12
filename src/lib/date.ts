import { Slot } from "./db";

export const dateOptions = {
  timeZone: "Europe/Lisbon",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

export function getDateString(date: Date) {
  if (!date) return "";

  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function getDateStringPT(date: Date) {
  if (!date) return "";

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function getTimeString(date: Date) {
  if (!date) return "";

  return date.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function generateDates() {
  const dates = [];
  const start = new Date(2025, 9, 13); // Months are 0-indexed (9 = October)
  const end = new Date(2025, 9, 17);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  return dates;
}

export function generateTimeSlots(startHour, endHour, duration) {
  const times = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      times.push(timeString);
    }
  }
  return times;
}

export function formatDateHeader(date: Date) {
  return {
    dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
    dayNumber: date.getDate(),
    month: date.toLocaleDateString("en-US", { month: "short" }),
  };
}

export function getSlotForCell(date: Date, time: string, slots: Slot[]) {
  const [hours, minutes] = time.split(":").map(Number);
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);

  return slots?.find(
    (slot) => slot?.start.getTime() === slotDateTime.getTime(),
  );
}

export function getBookingsForCell(
  date: Date,
  time: string,
  bookings: Array<{
    slot: Slot;
  }>,
) {
  const [hours, minutes] = time.split(":").map(Number);
  const dateWithTime = new Date(date);
  dateWithTime.setHours(hours, minutes, 0, 0); // set H:M:00.000

  return bookings?.filter(
    (b) =>
      b?.slot.start.getTime() === dateWithTime.getTime() &&
      b?.slot.start.getDay() === dateWithTime.getDay(),
  );
}

export function getCellKey(date: Date, time: string) {
  const dateStr = date.toISOString().split("T")[0];
  return new Date(`${dateStr}T${time}:00`);
}

export function overlap(slot: Slot, start: Date, duration: number): boolean {
  const slotStart = slot.start.getTime();
  const slotEnd = slotStart + slot.duration * 60_000; // assuming duration is in minutes

  const newStart = start.getTime();
  const newEnd = newStart + duration * 60_000;

  // Overlap occurs if one starts before the other ends, and ends after the other starts
  return slotStart < newEnd && slotEnd > newStart;
}
