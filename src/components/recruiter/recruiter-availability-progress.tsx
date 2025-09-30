"use client";

import {
  formatDateHeader,
  generateDates,
  generateTimeSlots,
  getCellKey,
  getSlotForCell,
} from "@/lib/date";
import ChooseCustomSlot from "../slot/choose-custom-slot";
import { useRef, useState } from "react";
import { NewRecruiterAvailability, RecruiterAvailability } from "@/lib/db";
import SlotConfigPanel from "../slot/slot-config-panel";

import { toast } from "sonner";

export type AvailabilityOperation = {
  type: "add" | "remove";
  availability: RecruiterAvailability;
};

interface RecruiterAvailabilityClientProps {
  currentAvailabilities: RecruiterAvailability[];
  recruiterId: string;
  saveAvailabilities: (
    availabilities: AvailabilityOperation[],
  ) => Promise<boolean>;
}

export default function RecruiterAvailabilityClient({
  currentAvailabilities,
  recruiterId,
  saveAvailabilities,
}: RecruiterAvailabilityClientProps) {
  const [availabilities, setAvailabilities] = useState<
    NewRecruiterAvailability[]
  >(currentAvailabilities);

  const [availabilityOperations, setAvailabilityOperations] = useState([]);

  const tableRef = useRef<HTMLTableElement>(null);

  const handleCellClick = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);

    const end = new Date(start);
    end.setMinutes(start.getMinutes() + 30);

    const existingIndex = availabilities.findIndex(
      (slot) =>
        slot.start.getTime() === start.getTime() &&
        slot.start.getTime() + slot.duration * 60000 === end.getTime(),
    );

    if (existingIndex !== -1) {
      const avails = availabilities.filter((_, i) => i != existingIndex);

      setAvailabilities(avails);
      setAvailabilityOperations((prev) => [
        ...prev.filter(
          (s) =>
            !(
              s.type === "remove" &&
              s.slot.start.getTime() === start.getTime() &&
              s.slot.start.getTime() + s.slot.duration * 60000 === end.getTime()
            ),
        ),
        { type: "remove", slot: avails[existingIndex] },
      ]);
    } else {
      const newAvailibity = {
        start: start,
        duration: 30,
        recruitmentYear: new Date().getFullYear(),
        recruiterId: recruiterId,
      };

      setAvailabilities((prev) => [...prev, newAvailibity]);
      setAvailabilityOperations((prev) => [
        ...prev,
        {
          type: "add",
          availability: newAvailibity,
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="w-fit">
        <SlotConfigPanel
          showConfig={false}
          slotConfig={{
            interview: {
              startHour: 9,
              endHour: 19,
              duration: 30,
              quantity: 2,
            },
            dynamic: {
              startHour: 9,
              endHour: 19,
              duration: 45,
              quantity: 5,
            },
          }}
          setSlotConfig={() => {}}
          slotType={""}
          handleSaveSlots={async () => {
            const ok = await saveAvailabilities(availabilityOperations);

            if (ok) toast("Slots guardados");
          }}
          setSlotType={() => {}}
        />
      </div>

      <ChooseCustomSlot
        slots={availabilities}
        dates={generateDates()}
        tableRef={tableRef}
        timeSlots={generateTimeSlots(9, 19, 30)}
        getSlotForCell={getSlotForCell}
        getCellKey={getCellKey}
        selectedSlot={null}
        handleCellClick={handleCellClick}
        getTypeColor={() => "bg-blue-500"}
        formatDateHeader={formatDateHeader}
      />
    </div>
  );
}
