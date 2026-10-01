"use client";

import React, { useMemo, useState } from "react";
import { addDays, format, isToday } from "date-fns";
import { pt } from "date-fns/locale";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { generateTimeSlots } from "@/lib/date";
import type { Dynamic, Interview, Slot } from "@/lib/db";
import type { CandidateListMetadata } from "@/lib/candidate";

import BookingSlotDialog from "../slot/booking-slot-dialog";
import { BookingAdminStats } from "./booking-admin-stats";
import { SlotType } from "./slot-admin-calendar";

export type ViewDaysMode = "workdays" | "fullweek";

interface BookingManagementClientProps {
  candidates: Array<CandidateListMetadata>;
  recruitmentId: number;
  existingSlots?: {
    interview: Slot[];
    dynamic: Slot[];
  };
  bookings: {
    interview: Array<
      Interview & {
        slot: Slot;
        candidate?: any;
        recruiters?: any[];
      }
    >;
    dynamic: Array<
      Dynamic & {
        slot: Slot;
        candidates?: any[];
        recruiters?: any[];
      }
    >;
  };
}

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

export default function BookingManagementClient({
  candidates,
  existingSlots = {
    interview: [],
    dynamic: [],
  },
  bookings,
}: BookingManagementClientProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [slotType, setSlotType] = useState<SlotType>(SlotType.interview);
  const [onlyMissingRecruiters, setOnlyMissingRecruiters] = useState(false);

  const [viewDaysMode, setViewDaysMode] = useState<ViewDaysMode>(() => {
    const all = [
      ...existingSlots.interview,
      ...existingSlots.dynamic,
      ...(bookings.interview?.map((b) => b.slot) || []),
      ...(bookings.dynamic?.map((b) => b.slot) || []),
    ];
    const hasWeekend = all.some((s) => {
      if (!s?.start) return false;
      const day = new Date(s.start).getDay();
      return day === 0 || day === 6;
    });
    return hasWeekend ? "fullweek" : "workdays";
  });

  const dates = useMemo(() => {
    const daysCount = viewDaysMode === "workdays" ? 5 : 7;
    return Array.from({ length: daysCount }, (_, i) => addDays(weekStart, i));
  }, [weekStart, viewDaysMode]);

  const weekEnd = dates[dates.length - 1];

  const timeSlots = useMemo(() => {
    let minH = 9;
    let maxH = 19;
    const all = [
      ...existingSlots.interview,
      ...existingSlots.dynamic,
      ...(bookings.interview?.map((b) => b.slot) || []),
      ...(bookings.dynamic?.map((b) => b.slot) || []),
    ];
    for (const item of all) {
      if (!item?.start) continue;
      const h = new Date(item.start).getHours();
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }
    const currentList = existingSlots[slotType] || [];
    const step = currentList[0]?.duration || 30;
    const validStep = step > 0 && step <= 120 ? step : 30;
    return generateTimeSlots(minH, maxH, validStep);
  }, [existingSlots, bookings, slotType]);

  const formatCellKey = (date: Date, time: string) => {
    const d = new Date(date);
    const datePart = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    return `${datePart}-${time}`;
  };

  const slotMap = useMemo(() => {
    const map = new Map<string, Slot>();
    for (const item of existingSlots[slotType] || []) {
      const d = new Date(item.start);
      const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      const key = formatCellKey(d, timePart);
      map.set(key, item);
    }
    return map;
  }, [existingSlots, slotType]);

  const bookingsMap = useMemo(() => {
    const map = new Map<string, any[]>();
    const list = bookings[slotType] || [];
    for (const item of list) {
      const slotObj = (item as any)?.slot;
      if (!slotObj?.start) continue;
      const d = new Date(slotObj.start);
      const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      const key = formatCellKey(d, timePart);
      const existing = map.get(key) || [];
      existing.push(item);
      map.set(key, existing);
    }
    return map;
  }, [bookings, slotType]);

  const moveWeek = (amount: number) => {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + amount * 7);
      return next;
    });
  };

  const isInterview = slotType === SlotType.interview;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marcações & Entrevistas"
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
          </div>
        }
      />

      <BookingAdminStats
        bookings={bookings}
        candidates={candidates}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />

      <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="border-b bg-muted/20 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
                <Button
                  type="button"
                  size="sm"
                  variant={
                    slotType === SlotType.interview ? "secondary" : "ghost"
                  }
                  onClick={() => setSlotType(SlotType.interview)}
                >
                  <span className="size-2 rounded-full bg-blue-500 mr-1.5" />
                  <span>Entrevistas</span>
                  <span className="ml-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 text-[10px] font-semibold">
                    {bookings.interview?.length || 0}
                  </span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    slotType === SlotType.dynamic ? "secondary" : "ghost"
                  }
                  onClick={() => setSlotType(SlotType.dynamic)}
                >
                  <span className="size-2 rounded-full bg-emerald-500 mr-1.5" />
                  <span>Dinâmicas</span>
                  <span className="ml-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-semibold">
                    {bookings.dynamic?.length || 0}
                  </span>
                </Button>
              </div>

              <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
                <Button
                  type="button"
                  size="sm"
                  variant={viewDaysMode === "workdays" ? "secondary" : "ghost"}
                  onClick={() => setViewDaysMode("workdays")}
                >
                  Dias úteis
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewDaysMode === "fullweek" ? "secondary" : "ghost"}
                  onClick={() => setViewDaysMode("fullweek")}
                >
                  Semana inteira
                </Button>
              </div>

              <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
                <Button
                  type="button"
                  size="sm"
                  variant={onlyMissingRecruiters ? "destructive" : "ghost"}
                  onClick={() =>
                    setOnlyMissingRecruiters(!onlyMissingRecruiters)
                  }
                  className="gap-1.5"
                >
                  <Filter className="size-3.5" />
                  <span>Apenas sem recrutador</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs border border-blue-500 bg-blue-100 dark:bg-blue-900/60" />
                <span>Agendado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs border border-dashed border-border bg-muted/40" />
                <span>Vaga livre</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs border border-destructive bg-destructive/10" />
                <span>Sem recrutador</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-0">
          <div className="relative w-full overflow-x-auto touch-pan-x">
            <table className="w-full border-collapse select-none text-left">
              <thead>
                <tr className="border-b border-border bg-muted/15">
                  <th className="sticky left-0 top-0 z-30 w-20 border-r border-border bg-card p-2 text-center text-xs font-semibold text-muted-foreground shadow-[1px_0_0_0_var(--border)]" />

                  {dates.map((date) => {
                    const today = isToday(date);
                    const dayName = format(date, "EEE", {
                      locale: pt,
                    }).replace(".", "");

                    return (
                      <th
                        key={date.toISOString()}
                        className={cn(
                          "min-w-[140px] border-r border-border py-2.5 px-2 text-center transition-colors select-none",
                          today && "bg-primary/5",
                        )}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            {dayName}
                          </span>
                          <span
                            className={cn(
                              "inline-flex size-6 items-center justify-center text-sm font-semibold text-foreground",
                              today &&
                                "rounded-full bg-primary text-xs font-bold text-primary-foreground",
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

              <tbody>
                {timeSlots.map((time) => {
                  const isHour = time.endsWith(":00");

                  return (
                    <tr
                      key={time}
                      className={cn(
                        "transition-colors",
                        isHour
                          ? "border-t border-border/80"
                          : "border-t border-border/20 border-dashed",
                      )}
                    >
                      <td
                        className={cn(
                          "sticky left-0 z-20 w-20 border-r border-border bg-card p-1 text-center font-medium shadow-[1px_0_0_0_var(--border)] select-none",
                          isHour
                            ? "text-xs font-semibold text-foreground"
                            : "text-[11px] text-muted-foreground/75",
                        )}
                      >
                        {time}
                      </td>

                      {dates.map((date) => {
                        const cellKey = formatCellKey(date, time);
                        const currentSlot = slotMap.get(cellKey);
                        const cellBookings = bookingsMap.get(cellKey) || [];

                        const filteredBookings = onlyMissingRecruiters
                          ? cellBookings.filter(
                              (b: any) => (b.recruiters?.length || 0) === 0,
                            )
                          : cellBookings;

                        return (
                          <td
                            key={`${date.toISOString()}-${time}`}
                            className={cn(
                              "relative min-h-12 p-1 border-r border-border/40 transition-colors align-top",
                              isToday(date) && "bg-primary/2",
                            )}
                          >
                            <div className="h-full w-full space-y-1">
                              {filteredBookings.length > 0 ? (
                                filteredBookings.map((booking: any) => {
                                  const title =
                                    booking.candidate?.user?.name ||
                                    `Dinâmica #${booking.id}`;
                                  const recruitersCount =
                                    booking.recruiters?.length || 0;
                                  const isMissingRecruiter =
                                    recruitersCount === 0;

                                  return (
                                    <div
                                      key={booking.id}
                                      className={cn(
                                        "rounded-md border p-2 shadow-2xs text-left space-y-1.5 transition-all",
                                        isMissingRecruiter
                                          ? "border-destructive/60 bg-destructive/5 text-destructive dark:bg-destructive/10"
                                          : isInterview
                                            ? "border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100"
                                            : "border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100",
                                      )}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="text-xs font-semibold truncate leading-tight">
                                          {title}
                                        </span>
                                      </div>

                                      <BookingSlotDialog
                                        booking={booking}
                                        slotType={slotType}
                                        existingSlot={booking}
                                        trigger={
                                          <Button
                                            type="button"
                                            variant={
                                              isMissingRecruiter
                                                ? "destructive"
                                                : "outline"
                                            }
                                            size="xs"
                                            className={cn(
                                              "w-full h-5 text-[10px] px-1.5 justify-between font-medium",
                                              !isMissingRecruiter &&
                                                "bg-background/80 hover:bg-background",
                                            )}
                                          >
                                            <span className="flex items-center gap-1">
                                              {isMissingRecruiter ? (
                                                <AlertCircle className="size-2.5" />
                                              ) : (
                                                <Users className="size-2.5 opacity-60" />
                                              )}
                                              <span>Recrutadores</span>
                                            </span>
                                            <span className="font-semibold tabular-nums">
                                              {recruitersCount}
                                            </span>
                                          </Button>
                                        }
                                      />
                                    </div>
                                  );
                                })
                              ) : !onlyMissingRecruiters && currentSlot ? (
                                <div className="h-[calc(100%-4px)] my-0.5 rounded-md border border-dashed border-border/80 bg-muted/20 p-1.5 flex flex-col justify-between text-muted-foreground select-none">
                                  <div className="flex items-center justify-between text-[10px] font-medium leading-none">
                                    <span>{time}</span>
                                    <span>{currentSlot.duration}m</span>
                                  </div>
                                  <span className="text-[9px] text-muted-foreground/75 font-normal leading-none mt-1">
                                    Livre · 0/{currentSlot.quantity} vagas
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
