"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toast";
import { generateTimeSlots } from "@/lib/date";
import type { NewRecruiterAvailability, RecruiterAvailability } from "@/lib/db";

import {
  RecruiterAvailabilityCalendar,
  type PaintShape,
  type SlotCell,
  type ViewDaysMode,
} from "./recruiter-availability-calendar";
import { RecruiterAvailabilityStats } from "./recruiter-availability-stats";

export type AvailabilityOperation = {
  type: "add" | "remove";
  availability: RecruiterAvailability | NewRecruiterAvailability;
};

const SLOT_MINUTES = 30;

function getMonday(d: Date = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatWeekRange(start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = format(start, "MMM", { locale: pt });
  const endMonth = format(end, "MMM", { locale: pt });
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear !== endYear) {
    return `${startDay} ${startMonth} ${startYear} — ${endDay} ${endMonth} ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startDay} ${startMonth} — ${endDay} ${endMonth} ${endYear}`;
  }
  return `${startDay} — ${endDay} ${startMonth} ${startYear}`;
}

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

  const [saving, setSaving] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [viewDaysMode, setViewDaysMode] = useState<ViewDaysMode>(() => {
    const hasWeekendSlot = currentAvailabilities.some((s) => {
      const day = new Date(s.start).getDay();
      return day === 0 || day === 6;
    });
    return hasWeekendSlot ? "fullweek" : "workdays";
  });
  const [shape, setShape] = useState<PaintShape>("paint");

  const dates = useMemo(() => {
    const daysCount = viewDaysMode === "workdays" ? 5 : 7;
    return Array.from({ length: daysCount }, (_, i) => addDays(weekStart, i));
  }, [weekStart, viewDaysMode]);

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

  const moveWeek = (amount: number) => {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + amount * 7);
      return next;
    });
  };

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

  const handleApplyPreset = (presetType: string, targetDate?: Date) => {
    const makeSlotsForDate = (date: Date, startH: number, endH: number) => {
      const slots: NewRecruiterAvailability[] = [];
      for (let h = startH; h < endH; h++) {
        for (let m = 0; m < 60; m += SLOT_MINUTES) {
          const d = new Date(date);
          d.setHours(h, m, 0, 0);
          slots.push({
            start: d,
            duration: SLOT_MINUTES,
            recruitmentId,
            recruiterId,
          });
        }
      }
      return slots;
    };

    const getWeekTimeRange = (start: Date) => {
      const s = new Date(start);
      s.setHours(0, 0, 0, 0);
      const e = addDays(s, 7);
      return { startMs: s.getTime(), endMs: e.getTime() };
    };

    const { startMs: curWeekStartMs, endMs: curWeekEndMs } =
      getWeekTimeRange(weekStart);

    if (presetType === "day-workdays" && targetDate) {
      const slots = makeSlotsForDate(targetDate, 9, 18);
      const targetDayStr = targetDate.toDateString();
      setAvailabilities((prev) => [
        ...prev.filter(
          (s) => new Date(s.start).toDateString() !== targetDayStr,
        ),
        ...slots,
      ]);
      toast.add({ title: "Horário de dia útil aplicado (09:00 - 18:00)" });
      return;
    }

    if (presetType === "day-morning" && targetDate) {
      const slots = makeSlotsForDate(targetDate, 9, 13);
      const targetDayStr = targetDate.toDateString();
      setAvailabilities((prev) => [
        ...prev.filter(
          (s) => new Date(s.start).toDateString() !== targetDayStr,
        ),
        ...slots,
      ]);
      toast.add({ title: "Horário da manhã aplicado (09:00 - 13:00)" });
      return;
    }

    if (presetType === "day-afternoon" && targetDate) {
      const slots = makeSlotsForDate(targetDate, 14, 18);
      const targetDayStr = targetDate.toDateString();
      setAvailabilities((prev) => [
        ...prev.filter(
          (s) => new Date(s.start).toDateString() !== targetDayStr,
        ),
        ...slots,
      ]);
      toast.add({ title: "Horário da tarde aplicado (14:00 - 18:00)" });
      return;
    }

    if (presetType === "day-full" && targetDate) {
      const slots = makeSlotsForDate(targetDate, 9, 20);
      const targetDayStr = targetDate.toDateString();
      setAvailabilities((prev) => [
        ...prev.filter(
          (s) => new Date(s.start).toDateString() !== targetDayStr,
        ),
        ...slots,
      ]);
      toast.add({ title: "Dia completo aplicado (09:00 - 20:00)" });
      return;
    }

    if (presetType === "day-clear" && targetDate) {
      const targetDayStr = targetDate.toDateString();
      setAvailabilities((prev) =>
        prev.filter((s) => new Date(s.start).toDateString() !== targetDayStr),
      );
      toast.add({ title: "Horários removidos para este dia" });
      return;
    }

    if (presetType === "workdays-full") {
      const newSlots: NewRecruiterAvailability[] = [];
      for (let i = 0; i < 5; i++) {
        const d = addDays(weekStart, i);
        newSlots.push(...makeSlotsForDate(d, 9, 18));
      }
      setAvailabilities((prev) => [
        ...prev.filter((s) => {
          const t = new Date(s.start).getTime();
          return t < curWeekStartMs || t >= curWeekEndMs;
        }),
        ...newSlots,
      ]);
      toast.add({ title: "Dias úteis preenchidos (09:00 - 18:00)" });
      return;
    }

    if (presetType === "workdays-morning") {
      const newSlots: NewRecruiterAvailability[] = [];
      for (let i = 0; i < 5; i++) {
        const d = addDays(weekStart, i);
        newSlots.push(...makeSlotsForDate(d, 9, 13));
      }
      setAvailabilities((prev) => [
        ...prev.filter((s) => {
          const t = new Date(s.start).getTime();
          return t < curWeekStartMs || t >= curWeekEndMs;
        }),
        ...newSlots,
      ]);
      toast.add({ title: "Manhãs preenchidas (09:00 - 13:00)" });
      return;
    }

    if (presetType === "workdays-afternoon") {
      const newSlots: NewRecruiterAvailability[] = [];
      for (let i = 0; i < 5; i++) {
        const d = addDays(weekStart, i);
        newSlots.push(...makeSlotsForDate(d, 14, 18));
      }
      setAvailabilities((prev) => [
        ...prev.filter((s) => {
          const t = new Date(s.start).getTime();
          return t < curWeekStartMs || t >= curWeekEndMs;
        }),
        ...newSlots,
      ]);
      toast.add({ title: "Tardes preenchidas (14:00 - 18:00)" });
      return;
    }

    if (presetType === "copy-previous-week") {
      const { startMs: prevWeekStartMs, endMs: prevWeekEndMs } =
        getWeekTimeRange(addDays(weekStart, -7));

      const prevWeekSlots = availabilities.filter((s) => {
        const t = new Date(s.start).getTime();
        return t >= prevWeekStartMs && t < prevWeekEndMs;
      });

      if (prevWeekSlots.length === 0) {
        toast.add({ title: "Não existem horários na semana anterior" });
        return;
      }

      const shifted = prevWeekSlots.map((s) => {
        const nextDate = new Date(s.start);
        nextDate.setDate(nextDate.getDate() + 7);
        return {
          start: nextDate,
          duration: s.duration,
          recruitmentId,
          recruiterId,
        };
      });

      setAvailabilities((prev) => [
        ...prev.filter((s) => {
          const t = new Date(s.start).getTime();
          return t < curWeekStartMs || t >= curWeekEndMs;
        }),
        ...shifted,
      ]);
      toast.add({
        title: `${shifted.length} horários copiados da semana anterior`,
      });
      return;
    }

    if (presetType === "copy-to-next-week") {
      const thisWeekSlots = availabilities.filter((s) => {
        const t = new Date(s.start).getTime();
        return t >= curWeekStartMs && t < curWeekEndMs;
      });

      if (thisWeekSlots.length === 0) {
        toast.add({
          title: "Não existem horários na semana atual para copiar",
        });
        return;
      }

      const shifted = thisWeekSlots.map((s) => {
        const nextDate = new Date(s.start);
        nextDate.setDate(nextDate.getDate() + 7);
        return {
          start: nextDate,
          duration: s.duration,
          recruitmentId,
          recruiterId,
        };
      });

      const { startMs: nextWeekStartMs, endMs: nextWeekEndMs } =
        getWeekTimeRange(addDays(weekStart, 7));

      setAvailabilities((prev) => [
        ...prev.filter((s) => {
          const t = new Date(s.start).getTime();
          return t < nextWeekStartMs || t >= nextWeekEndMs;
        }),
        ...shifted,
      ]);
      toast.add({
        title: `${shifted.length} horários duplicados para a próxima semana`,
      });
      return;
    }

    if (presetType === "clear-week") {
      setAvailabilities((prev) =>
        prev.filter((s) => {
          const t = new Date(s.start).getTime();
          return t < curWeekStartMs || t >= curWeekEndMs;
        }),
      );
      toast.add({ title: "Horários da semana atual removidos" });
      return;
    }

    if (presetType === "clear-all") {
      setAvailabilities([]);
      toast.add({ title: "Todas as disponibilidades removidas" });
      return;
    }
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
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border bg-card p-[0.5] shadow-2xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setWeekStart(getMonday(new Date()))}
              >
                Hoje
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => moveWeek(-1)}
                aria-label="Semana anterior"
                title="Semana anterior"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-28 text-center text-xs font-medium text-muted-foreground px-2 select-none">
                {formatWeekRange(weekStart, weekEnd)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => moveWeek(1)}
                aria-label="Semana seguinte"
                title="Semana seguinte"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>Guardar</span>
            </Button>
          </div>
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
        onApplyPreset={handleApplyPreset}
        shape={shape}
        onShapeChange={setShape}
        viewDaysMode={viewDaysMode}
        onViewDaysModeChange={setViewDaysMode}
        slotMinutes={SLOT_MINUTES}
      />
    </div>
  );
}
