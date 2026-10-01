"use client";

import React, { useMemo } from "react";
import { addDays, format, isToday } from "date-fns";
import { pt } from "date-fns/locale";

import { generateTimeSlots, getMonday, formatWeekRange } from "@/lib/date";
import { WeekNavigator } from "@/components/calendar/week-navigator";
import { cn } from "@/lib/utils";

export { getMonday, formatWeekRange };
export { WeekNavigator };

export function getEndTimeString(
  startTime: string,
  durationMinutes: number,
): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const endH = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const endM = (total % 60).toString().padStart(2, "0");
  return `${endH}:${endM}`;
}

export interface ScheduleWeekGridProps {
  weekStart: Date;
  onWeekChange?: (newWeekStart: Date) => void;
  showWeekNavigator?: boolean;
  slotMinutes?: number;
  minHour?: number;
  maxHour?: number;
  timeSlots?: string[];
  renderCell: (
    date: Date,
    time: string,
    colIndex: number,
    rowIndex: number,
  ) => React.ReactNode;
  actions?: React.ReactNode;
  headerPrepend?: React.ReactNode;
  className?: string;
  emptyCellClassName?: string;
}

export function ScheduleWeekGrid({
  weekStart,
  onWeekChange,
  showWeekNavigator = false,
  slotMinutes = 30,
  minHour = 9,
  maxHour = 19,
  timeSlots: customTimeSlots,
  renderCell,
  actions,
  headerPrepend,
  className,
  emptyCellClassName,
}: ScheduleWeekGridProps) {
  // Always 5 working days (Monday to Friday)
  const dates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const timeSlots = useMemo(() => {
    if (customTimeSlots && customTimeSlots.length > 0) {
      return customTimeSlots;
    }
    return generateTimeSlots(minHour, maxHour, slotMinutes);
  }, [customTimeSlots, minHour, maxHour, slotMinutes]);

  const hasToolbar = showWeekNavigator || headerPrepend || actions;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs",
        className,
      )}
    >
      {/* Grid Toolbar (when enabled) */}
      {hasToolbar && (
        <div className="border-b bg-muted/20 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {headerPrepend}

              {showWeekNavigator && onWeekChange && (
                <WeekNavigator
                  weekStart={weekStart}
                  onWeekChange={onWeekChange}
                />
              )}
            </div>

            {actions && (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            )}
          </div>
        </div>
      )}

      {/* Grid Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          {/* Header Row */}
          <thead>
            <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
              <th className="sticky left-0 z-20 w-18 border-r bg-muted/40 px-3 py-2 text-center">
                Hora
              </th>
              {dates.map((date) => {
                const today = isToday(date);
                return (
                  <th
                    key={date.toISOString()}
                    className={cn(
                      "border-r px-3 py-2 text-center transition-colors last:border-r-0",
                      today ? "bg-primary/10 text-primary font-bold" : "",
                    )}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[11px] uppercase tracking-wider font-semibold">
                        {format(date, "EEE", { locale: pt })}
                      </span>
                      <span
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                          today
                            ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                            : "text-foreground",
                        )}
                      >
                        {format(date, "d")}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Time Slot Rows */}
          <tbody className="divide-y divide-border text-xs">
            {timeSlots.map((time, rowIndex) => (
              <tr
                key={time}
                className="group hover:bg-muted/10 transition-colors"
              >
                {/* Time Label Column */}
                <td className="sticky left-0 z-10 w-18 border-r bg-background/95 px-2 py-1 text-center font-mono text-[11px] text-muted-foreground select-none">
                  {time}
                </td>

                {/* Day Columns */}
                {dates.map((date, colIndex) => {
                  const today = isToday(date);
                  const content = renderCell(date, time, colIndex, rowIndex);

                  return (
                    <td
                      key={`${date.toISOString()}-${time}`}
                      className={cn(
                        "relative h-12 min-w-28 border-r p-1 align-top transition-colors last:border-r-0",
                        today ? "bg-primary/[0.02]" : "",
                        !content && emptyCellClassName,
                      )}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
