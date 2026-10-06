"use client";

import React, { useMemo, useState } from "react";
import { addDays, format, isToday } from "date-fns";
import { pt } from "date-fns/locale";
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Filter,
  Search,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn, getInitials } from "@/lib/utils";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { generateTimeSlots, getMonday } from "@/lib/date";
import { WeekNavigator } from "@/components/calendar/week-navigator";
import type { Dynamic, Interview, Slot } from "@/lib/db";
import type { TeamRecruiter } from "@/lib/calendar";
import type {
  CandidateListMetadata,
  CandidateSchedulingStats,
} from "@/lib/candidate";

import BookingSlotDialog from "../slot/booking-slot-dialog";
import { BookingAdminStats } from "./booking-admin-stats";
import { SlotType } from "./slot-admin-calendar";

/** @deprecated Weekends are deprecated; all calendars use 5 working days */
export type ViewDaysMode = "workdays" | "fullweek";

interface BookingManagementClientProps {
  candidates?: Array<CandidateListMetadata>;
  candidateStats?: CandidateSchedulingStats;
  recruitmentId: number;
  existingSlots?: {
    interview: Slot[];
    dynamic: Slot[];
  };
  recruiters?: TeamRecruiter[];
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

export default function BookingManagementClient({
  candidates,
  candidateStats,
  existingSlots = {
    interview: [],
    dynamic: [],
  },
  recruiters = [],
  bookings,
}: BookingManagementClientProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [slotType, setSlotType] = useState<SlotType>(SlotType.interview);
  const [onlyMissingRecruiters, setOnlyMissingRecruiters] = useState(false);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>("all");
  const [headerFilterOpen, setHeaderFilterOpen] = useState(false);
  const [headerFilterSearch, setHeaderFilterSearch] = useState("");

  // Always 5 working days (Monday to Friday)
  const dates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

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

  const currentSlots = useMemo(() => {
    const map = new Map<string, Slot>();
    for (const slot of existingSlots[slotType] || []) {
      const d = new Date(slot.start);
      const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      const key = formatCellKey(d, timePart);
      map.set(key, slot);
    }
    return map;
  }, [existingSlots, slotType]);

  const currentBookings = useMemo(() => {
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

  const allRecruiters = useMemo(() => {
    const map = new Map<string, TeamRecruiter>();
    for (const r of recruiters) {
      map.set(r.id, r);
    }
    const extractFromList = (list: any[]) => {
      for (const item of list || []) {
        for (const r of item.recruiters || []) {
          const u = r.recruiter?.user;
          if (u && !map.has(u.id)) {
            map.set(u.id, {
              id: u.id,
              name: u.name,
              email: u.email,
              image: u.image,
            });
          }
        }
      }
    };
    extractFromList(bookings.interview);
    extractFromList(bookings.dynamic);
    return Array.from(map.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || ""),
    );
  }, [recruiters, bookings]);

  const selectedRecruiter = useMemo(() => {
    return allRecruiters.find((r) => r.id === selectedRecruiterId);
  }, [allRecruiters, selectedRecruiterId]);

  const filteredRecruitersInHeader = useMemo(() => {
    const q = headerFilterSearch.toLowerCase().trim();
    if (!q) return allRecruiters;
    return allRecruiters.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [allRecruiters, headerFilterSearch]);

  const isInterview = slotType === SlotType.interview;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marcações & Entrevistas"
        viewModeToggle={
          <DropdownMenu
            open={headerFilterOpen}
            onOpenChange={(open) => {
              setHeaderFilterOpen(open);
              if (!open) setHeaderFilterSearch("");
            }}
          >
            <DropdownMenuTrigger
              className="flex items-center gap-2 h-8 px-2 md:px-2.5 rounded-md border border-input bg-background hover:bg-muted text-xs font-normal transition-colors outline-none cursor-pointer max-w-64 shrink-0"
              title={
                selectedRecruiterId === "all"
                  ? `Todos os Recrutadores (${allRecruiters.length})`
                  : selectedRecruiter?.name || "Recrutador"
              }
              aria-label={
                selectedRecruiterId === "all"
                  ? `Todos os Recrutadores (${allRecruiters.length})`
                  : selectedRecruiter?.name || "Recrutador"
              }
            >
              {selectedRecruiterId === "all" ? (
                <>
                  <Users className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="hidden md:inline truncate">
                    Todos os Recrutadores ({allRecruiters.length})
                  </span>
                </>
              ) : (
                <>
                  <Avatar className="size-4 rounded-sm shrink-0">
                    {selectedRecruiter?.image ? (
                      <AvatarImage
                        src={
                          getStableImageUrl(selectedRecruiter.image) ||
                          undefined
                        }
                        alt={selectedRecruiter.name}
                      />
                    ) : null}
                    <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-[8px] font-semibold">
                      {getInitials(
                        selectedRecruiter?.name ||
                          selectedRecruiter?.email ||
                          "",
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline truncate">
                    {selectedRecruiter?.name || "Recrutador"}
                  </span>
                </>
              )}
              <ChevronsUpDown className="hidden md:inline size-3.5 text-muted-foreground shrink-0 ml-auto opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-0">
              <div className="p-2 border-b border-border/40">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Pesquisar recrutador..."
                    value={headerFilterSearch}
                    onChange={(e) => setHeaderFilterSearch(e.target.value)}
                    className="h-8 pl-8 pr-2 text-xs"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRecruiterId("all");
                    setHeaderFilterOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm cursor-pointer",
                    selectedRecruiterId === "all" && "bg-accent font-medium",
                  )}
                >
                  <Users className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">
                    Todos os Recrutadores ({allRecruiters.length})
                  </span>
                  {selectedRecruiterId === "all" && (
                    <Check className="size-3.5 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>

                {filteredRecruitersInHeader.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    Nenhum recrutador encontrado
                  </div>
                ) : (
                  filteredRecruitersInHeader.map((r) => {
                    const isSelected = selectedRecruiterId === r.id;
                    const userPicture = getStableImageUrl(r.image);
                    return (
                      <DropdownMenuItem
                        key={r.id}
                        onClick={() => {
                          setSelectedRecruiterId(r.id);
                          setHeaderFilterOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm cursor-pointer",
                          isSelected && "bg-accent font-medium",
                        )}
                      >
                        <Avatar className="size-5 rounded-sm shrink-0">
                          {userPicture ? (
                            <AvatarImage src={userPicture} alt={r.name} />
                          ) : null}
                          <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-[8px] font-semibold">
                            {getInitials(r.name || r.email || r.id)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="truncate">{r.name}</span>
                          {r.email && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {r.email}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="size-3.5 text-primary shrink-0" />
                        )}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        }
        actions={
          <WeekNavigator
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            className="w-full md:w-auto"
          />
        }
      />

      <BookingAdminStats
        bookings={bookings}
        candidates={candidates}
        candidateStats={candidateStats}
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
                <span className="size-2.5 rounded-xs border border-rose-500 bg-rose-100 dark:bg-rose-900/60" />
                <span>Sem recrutador</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
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
            <tbody className="divide-y divide-border text-xs">
              {timeSlots.map((time) => (
                <tr
                  key={time}
                  className="group hover:bg-muted/10 transition-colors"
                >
                  <td className="sticky left-0 z-10 w-18 border-r bg-background/95 px-2 py-1 text-center font-mono text-[11px] text-muted-foreground select-none">
                    {time}
                  </td>
                  {dates.map((date) => {
                    const cellKey = formatCellKey(date, time);
                    const currentSlot = currentSlots.get(cellKey);
                    const cellBookings = currentBookings.get(cellKey) || [];

                    let filteredBookings = cellBookings;

                    if (onlyMissingRecruiters) {
                      filteredBookings = filteredBookings.filter(
                        (b: any) => (b.recruiters?.length || 0) === 0,
                      );
                    }

                    if (selectedRecruiterId !== "all") {
                      filteredBookings = filteredBookings.filter((b: any) =>
                        (b.recruiters || []).some(
                          (r: any) =>
                            (r.recruiter?.user?.id ||
                              r.recruiter?.userId ||
                              r.recruiterId ||
                              r.userId ||
                              r.id) === selectedRecruiterId,
                        ),
                      );
                    }

                    return (
                      <td
                        key={`${date.toISOString()}-${time}`}
                        className={cn(
                          "relative min-h-12 p-1 border-r border-border/40 transition-colors align-top last:border-r-0",
                          isToday(date) && "bg-primary/2",
                        )}
                      >
                        <div className="h-full w-full space-y-1">
                          {filteredBookings.length > 0 ? (
                            filteredBookings.map((booking: any) => {
                              const candidateObj = isInterview
                                ? booking.candidate?.user || booking.candidate
                                : null;
                              const candidateName = candidateObj?.name;
                              const recruitersCount =
                                booking.recruiters?.length || 0;
                              const isMissingRecruiter = recruitersCount === 0;
                              const dynamicCandidateCount =
                                booking.candidates?.length || 0;

                              return (
                                <BookingSlotDialog
                                  key={booking.id}
                                  booking={booking}
                                  slotType={slotType}
                                  existingSlot={booking}
                                  trigger={
                                    <div
                                      className={cn(
                                        "group flex w-full flex-col gap-1 rounded-md border p-1.5 text-left transition-all shadow-2xs hover:shadow-xs cursor-pointer select-none",
                                        isMissingRecruiter
                                          ? "border-rose-500/30 bg-rose-50/70 hover:bg-rose-100/80 dark:border-rose-800/40 dark:bg-rose-950/25 dark:hover:bg-rose-950/45"
                                          : isInterview
                                            ? "border-blue-500/25 bg-blue-50/70 hover:bg-blue-100/80 dark:border-blue-800/40 dark:bg-blue-950/25 dark:hover:bg-blue-950/45"
                                            : "border-emerald-500/25 bg-emerald-50/70 hover:bg-emerald-100/80 dark:border-emerald-800/40 dark:bg-emerald-950/25 dark:hover:bg-emerald-950/45",
                                      )}
                                    >
                                      <div className="flex w-full items-center justify-between gap-1 leading-none">
                                        <span
                                          className={cn(
                                            "text-[11px] font-semibold tracking-tight",
                                            isMissingRecruiter
                                              ? "text-rose-700 dark:text-rose-300"
                                              : isInterview
                                                ? "text-blue-700 dark:text-blue-300"
                                                : "text-emerald-700 dark:text-emerald-300",
                                          )}
                                        >
                                          {isInterview
                                            ? "Entrevista"
                                            : "Dinâmica"}
                                        </span>
                                        {isMissingRecruiter ? (
                                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                            <AlertCircle className="size-2.5 shrink-0" />
                                            <span>Sem recrutador</span>
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                                            <Users className="size-2.5 opacity-70" />
                                            <span>{recruitersCount}</span>
                                          </span>
                                        )}
                                      </div>

                                      {isInterview ? (
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          {candidateObj ? (
                                            <span className="truncate text-xs font-medium text-foreground">
                                              {candidateName}
                                            </span>
                                          ) : (
                                            <span className="truncate text-xs text-muted-foreground italic">
                                              Sem candidato
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 min-w-0 text-muted-foreground">
                                          <Users className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                          <span className="truncate text-xs font-medium text-foreground">
                                            {dynamicCandidateCount}{" "}
                                            {dynamicCandidateCount === 1
                                              ? "candidato"
                                              : "candidatos"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  }
                                />
                              );
                            })
                          ) : !onlyMissingRecruiters &&
                            selectedRecruiterId === "all" &&
                            currentSlot ? (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
