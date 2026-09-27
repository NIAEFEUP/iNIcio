"use client";

import { Button } from "@/components/ui/button";
import {
  formatDateHeader,
  generateDates,
  generateTimeSlots,
  getCellKey,
  getSlotForCell,
} from "@/lib/date";
import ChooseCustomSlot, { SlotCell } from "../slot/choose-custom-slot";
import { useRef, useState } from "react";
import { NewRecruiterAvailability, RecruiterAvailability } from "@/lib/db";

import { toast } from "@/components/ui/toast";
import { Save } from "lucide-react";
import { RecruiterAvailabilityStats } from "./recruiter-availability-stats";

export type AvailabilityOperation = {
  type: "add" | "remove";
  availability: RecruiterAvailability | NewRecruiterAvailability;
};

const SLOT_MINUTES = 30;

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

  const [baseline, setBaseline] = useState<NewRecruiterAvailability[]>(
    currentAvailabilities,
  );

  const tableRef = useRef<HTMLTableElement>(null);

  const cellStart = ({ date, time }: SlotCell) => {
    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);
    return start;
  };

  const onCellsChange = (cells: SlotCell[], selected: boolean) => {
    setAvailabilities((prev) => {
      if (selected) {
        const additions = cells
          .map(cellStart)
          .filter(
            (start) => !prev.some((s) => s.start.getTime() === start.getTime()),
          )
          .map((start) => ({
            start,
            duration: SLOT_MINUTES,
            recruitmentId,
            recruiterId,
          }));
        return additions.length > 0 ? [...prev, ...additions] : prev;
      }

      const starts = new Set(cells.map((cell) => cellStart(cell).getTime()));
      const next = prev.filter((s) => !starts.has(s.start.getTime()));
      return next.length === prev.length ? prev : next;
    });
  };

  const handleSave = async () => {
    const selectedStarts = new Set(
      availabilities.map((s) => s.start.getTime()),
    );
    const baselineStarts = new Set(baseline.map((s) => s.start.getTime()));

    const operations: AvailabilityOperation[] = [
      ...baseline
        .filter((s) => !selectedStarts.has(s.start.getTime()))
        .map((availability) => ({ type: "remove" as const, availability })),
      ...availabilities
        .filter((s) => !baselineStarts.has(s.start.getTime()))
        .map((availability) => ({ type: "add" as const, availability })),
    ];

    try {
      const ok = await saveAvailabilities(operations);
      if (!ok) {
        toast.add({ title: "Erro ao guardar disponibilidade" });
        return;
      }

      setBaseline(availabilities);
      toast.add({ title: "Guardado com sucesso" });
    } catch {
      toast.add({ title: "Erro ao guardar disponibilidade" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <RecruiterAvailabilityStats availabilities={availabilities} />

      <ChooseCustomSlot
        slots={availabilities}
        dates={generateDates()}
        tableRef={tableRef}
        timeSlots={generateTimeSlots(9, 19, SLOT_MINUTES)}
        getSlotForCell={getSlotForCell}
        getCellKey={getCellKey}
        selectedSlot={null}
        onCellsChange={onCellsChange}
        getTypeColor={() => "bg-primary"}
        formatDateHeader={formatDateHeader}
        headerAction={
          <Button onClick={handleSave}>
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
              <div className="h-3 w-3 border-2 border-dashed border-gray-200 dark:border-muted-foreground/35 rounded"></div>
              <span>Indisponível</span>
            </div>
          </div>
        }
      />
    </div>
  );
}
