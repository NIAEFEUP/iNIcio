"use client";

import { Button } from "@/components/ui/button";
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

import { toast } from "@/components/ui/toast";
import { Save } from "lucide-react";
import { RecruiterAvailabilityStats } from "./recruiter-availability-stats";

export type AvailabilityOperation = {
  type: "add" | "remove";
  availability: RecruiterAvailability | NewRecruiterAvailability;
};

interface RecruiterAvailabilityClientProps {
  currentAvailabilities: RecruiterAvailability[];
  recruiterId: string;
  recruitmentId: number;
  saveAvailabilities: (
    availabilities: AvailabilityOperation[],
  ) => Promise<boolean>;
}

export default function RecruiterAvailabilityClient({
  currentAvailabilities,
  recruiterId,
  recruitmentId,
  saveAvailabilities,
}: RecruiterAvailabilityClientProps) {
  const [availabilities, setAvailabilities] = useState<
    NewRecruiterAvailability[]
  >(currentAvailabilities);

  const [availabilityOperations, setAvailabilityOperations] = useState<
    AvailabilityOperation[]
  >([]);

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
      setAvailabilityOperations((prev) => [
        ...prev.filter(
          (s) =>
            !(
              s.type === "remove" &&
              s.availability.start.getTime() === start.getTime() &&
              s.availability.start.getTime() +
                s.availability.duration * 60000 ===
                end.getTime()
            ),
        ),
        { type: "remove", availability: availabilities[existingIndex] },
      ]);

      setAvailabilities(availabilities.filter((_, i) => i != existingIndex));
    } else {
      const newAvailibity = {
        start: start,
        duration: 30,
        recruitmentId,
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
    <div className="flex flex-col gap-6">
      <RecruiterAvailabilityStats availabilities={availabilities} />

      <ChooseCustomSlot
        slots={availabilities}
        dates={generateDates()}
        tableRef={tableRef}
        timeSlots={generateTimeSlots(9, 19, 30)}
        getSlotForCell={getSlotForCell}
        getCellKey={getCellKey}
        selectedSlot={null}
        handleCellClick={handleCellClick}
        getTypeColor={() => "bg-primary"}
        formatDateHeader={formatDateHeader}
        headerAction={
          <Button
            onClick={async () => {
              const ok = await saveAvailabilities(availabilityOperations);

              if (ok) toast.add({ title: "Guardado com sucesso" });
            }}
          >
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        }
        legend={
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-primary rounded"></div>
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 border-2 border-dashed border-gray-200 rounded"></div>
              <span>Indisponível</span>
            </div>
          </div>
        }
      />
    </div>
  );
}
