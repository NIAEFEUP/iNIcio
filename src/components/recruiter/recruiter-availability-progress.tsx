"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toast";
import { generateTimeSlots, getMonday } from "@/lib/date";
import type { NewRecruiterAvailability, RecruiterAvailability } from "@/lib/db";
import { WeekNavigator } from "@/components/calendar/week-navigator";

import {
  RecruiterAvailabilityCalendar,
  type PaintShape,
  type SlotCell,
} from "./recruiter-availability-calendar";
import { RecruiterAvailabilityStats } from "./recruiter-availability-stats";

export type AvailabilityOperation = {
  type: "add" | "remove";
  availability: RecruiterAvailability | NewRecruiterAvailability;
};

export interface UnassignedSessionSummary {
  kind: "interview" | "dynamic";
  slotStart: string;
  candidateNames: string[];
}

export interface SaveAvailabilityResult {
  ok: boolean;
  unassigned: UnassignedSessionSummary[];
}

const SLOT_MINUTES = 30;

interface RecruiterAvailabilityClientProps {
  currentAvailabilities: RecruiterAvailability[];
  recruiterId: string;
  recruitmentId: number;
  saveAvailabilities: (
    availabilities: AvailabilityOperation[],
  ) => Promise<SaveAvailabilityResult>;
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

  const [saving, setSaving] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [shape, setShape] = useState<PaintShape>("paint");

  // Always 5 working days (Monday to Friday)
  const dates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const weekEnd = dates[dates.length - 1];

  const timeSlots = useMemo(() => {
    let minH = 9;
    let maxH = 19;
    for (const item of availabilities) {
      const h = new Date(item.start).getHours();
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }
    return generateTimeSlots(minH, maxH, SLOT_MINUTES);
  }, [availabilities]);

  const hasChanges = useMemo(() => {
    if (availabilities.length !== baseline.length) return true;
    const baselineSet = new Set(
      baseline.map((s) => new Date(s.start).getTime()),
    );
    return availabilities.some(
      (s) => !baselineSet.has(new Date(s.start).getTime()),
    );
  }, [availabilities, baseline]);

  useEffect(() => {
    if (!hasChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const cellStart = ({ date, time }: SlotCell): Date => {
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
            (start) =>
              !prev.some(
                (s) => new Date(s.start).getTime() === start.getTime(),
              ),
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
      const next = prev.filter((s) => !starts.has(new Date(s.start).getTime()));
      return next.length === prev.length ? prev : next;
    });
  };

  const handleDiscard = useCallback(() => {
    setAvailabilities(baseline);
    toast.add({ title: "Alterações descartadas" });
  }, [baseline]);

  const handleSave = useCallback(async () => {
    if (saving || !hasChanges) return;

    const selectedStarts = new Set(
      availabilities.map((s) => new Date(s.start).getTime()),
    );
    const baselineStarts = new Set(
      baseline.map((s) => new Date(s.start).getTime()),
    );

    const operations: AvailabilityOperation[] = [
      ...baseline
        .filter((s) => !selectedStarts.has(new Date(s.start).getTime()))
        .map((availability) => ({ type: "remove" as const, availability })),
      ...availabilities
        .filter((s) => !baselineStarts.has(new Date(s.start).getTime()))
        .map((availability) => ({ type: "add" as const, availability })),
    ];

    setSaving(true);
    try {
      const ok = await saveAvailabilities(operations);
      if (!ok) {
        toast.add({ title: "Erro ao guardar disponibilidades" });
        return;
      }

      setBaseline(availabilities);
      toast.add({ title: "Disponibilidades guardadas com sucesso" });
    } catch {
      toast.add({ title: "Erro ao guardar disponibilidades" });
    } finally {
      setSaving(false);
    }
  }, [saving, hasChanges, availabilities, baseline, saveAvailabilities]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges && !saving) {
          handleSave();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (hasChanges && !saving) {
          e.preventDefault();
          handleDiscard();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasChanges, saving, handleSave, handleDiscard]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marca as tuas disponibilidades"
        viewModeToggle={
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="h-8 gap-1.5 px-2.5 md:px-3 text-xs shrink-0"
            title="Guardar disponibilidades"
            aria-label="Guardar disponibilidades"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span className="hidden md:inline">Guardar</span>
          </Button>
        }
        actions={
          <WeekNavigator
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            className="w-full md:w-auto"
          />
        }
      />

      <RecruiterAvailabilityStats
        availabilities={availabilities}
        weekStart={weekStart}
        weekEnd={weekEnd}
        slotMinutes={SLOT_MINUTES}
      />

      <RecruiterAvailabilityCalendar
        dates={dates}
        timeSlots={timeSlots}
        availabilities={availabilities}
        onCellsChange={onCellsChange}
        shape={shape}
        onShapeChange={setShape}
        slotMinutes={SLOT_MINUTES}
      />
    </div>
  );
}
