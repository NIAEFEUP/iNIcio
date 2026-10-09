"use client";

import React, { useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Check,
  ChevronsUpDown,
  Clock,
  Search,
  UserCheck,
  Users,
} from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ScheduleWeekGrid,
  WeekNavigator,
  getMonday,
  getEndTimeString,
} from "@/components/calendar/schedule-week-grid";
import type { TeamAvailabilitySlot, TeamRecruiter } from "@/lib/calendar";
import { getInitials } from "@/lib/utils";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { cn } from "@/lib/utils";

interface TeamAvailabilityCalendarProps {
  availabilities: TeamAvailabilitySlot[];
  recruiters: TeamRecruiter[];
}

export function TeamAvailabilityCalendar({
  availabilities,
  recruiters,
}: TeamAvailabilityCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>("all");
  const [headerFilterOpen, setHeaderFilterOpen] = useState(false);
  const [headerFilterSearch, setHeaderFilterSearch] = useState("");

  const [activeSlotModal, setActiveSlotModal] = useState<{
    date: Date;
    time: string;
    recruiters: TeamRecruiter[];
  } | null>(null);
  const [modalSearch, setModalSearch] = useState("");

  // Filter by 5-day working week (Mon-Fri)
  const weekEnd = useMemo(() => {
    const end = addDays(weekStart, 4);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  const weekAvailabilities = useMemo(() => {
    const startMs = weekStart.getTime();
    const endMs = weekEnd.getTime();
    return availabilities.filter((a) => {
      const t = a.start.getTime();
      const endT = t + (a.duration || 30) * 60_000;
      return endT >= startMs && t <= endMs;
    });
  }, [availabilities, weekStart, weekEnd]);

  // Apply recruiter filter
  const displayedAvailabilities = useMemo(() => {
    if (selectedRecruiterId === "all") {
      return weekAvailabilities;
    }
    return weekAvailabilities.filter(
      (a) => a.recruiter.id === selectedRecruiterId,
    );
  }, [weekAvailabilities, selectedRecruiterId]);

  // Group by 30-min cell (date-time key), expanding duration if > 30 mins
  const cellRecruitersMap = useMemo(() => {
    const map = new Map<string, TeamRecruiter[]>();
    for (const item of displayedAvailabilities) {
      const duration = item.duration || 30;
      const step = 30;
      const slotsCount = Math.max(1, Math.floor(duration / step));

      for (let s = 0; s < slotsCount; s++) {
        const slotTime = new Date(item.start.getTime() + s * step * 60_000);
        const datePart = `${slotTime.getFullYear()}-${(slotTime.getMonth() + 1).toString().padStart(2, "0")}-${slotTime.getDate().toString().padStart(2, "0")}`;
        const timePart = `${slotTime.getHours().toString().padStart(2, "0")}:${slotTime.getMinutes().toString().padStart(2, "0")}`;
        const key = `${datePart}-${timePart}`;

        const list = map.get(key) || [];
        if (!list.some((r) => r.id === item.recruiter.id)) {
          list.push(item.recruiter);
        }
        map.set(key, list);
      }
    }
    return map;
  }, [displayedAvailabilities]);

  // Summary stats
  const activeRecruitersThisWeek = useMemo(() => {
    const set = new Set<string>();
    for (const a of weekAvailabilities) {
      set.add(a.recruiter.id);
    }
    return set.size;
  }, [weekAvailabilities]);

  const totalHours = useMemo(() => {
    const totalMinutes = displayedAvailabilities.reduce(
      (acc, cur) => acc + (cur.duration || 30),
      0,
    );
    return Math.round((totalMinutes / 60) * 10) / 10;
  }, [displayedAvailabilities]);

  const totalSlotsCount = useMemo(() => {
    return displayedAvailabilities.reduce(
      (acc, cur) => acc + Math.max(1, Math.floor((cur.duration || 30) / 30)),
      0,
    );
  }, [displayedAvailabilities]);

  // Pre-calculate minimum and maximum hours based on availabilities
  const { minHour, maxHour } = useMemo(() => {
    let min = 9;
    let max = 19;
    for (const a of displayedAvailabilities) {
      const startH = a.start.getHours();
      const endH = new Date(
        a.start.getTime() + (a.duration || 30) * 60_000,
      ).getHours();
      if (startH < min) min = startH;
      if (endH > max) max = endH;
    }
    return { minHour: min, maxHour: max };
  }, [displayedAvailabilities]);

  const renderGridCell = (date: Date, time: string) => {
    const datePart = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    const key = `${datePart}-${time}`;
    const slotRecruiters = cellRecruitersMap.get(key);

    if (!slotRecruiters || slotRecruiters.length === 0) {
      return null;
    }

    const count = slotRecruiters.length;

    return (
      <button
        type="button"
        onClick={() => {
          setModalSearch("");
          setActiveSlotModal({ date, time, recruiters: slotRecruiters });
        }}
        className="group flex w-full flex-col gap-1 rounded-md border border-emerald-500/25 bg-emerald-50/70 p-1.5 text-left transition-all shadow-2xs hover:bg-emerald-100/80 hover:shadow-xs dark:border-emerald-800/40 dark:bg-emerald-950/25 dark:hover:bg-emerald-950/45 cursor-pointer"
      >
        <div className="flex w-full items-center justify-between gap-1 leading-none">
          <span className="text-[11px] font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
            {count} {count === 1 ? "Disponível" : "Disponíveis"}
          </span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {time}
          </span>
        </div>

        {/* Recruiter Avatar Stack */}
        <div className="flex items-center -space-x-1.5 mt-0.5 overflow-hidden">
          {slotRecruiters.slice(0, 3).map((r) => {
            const userPicture = getStableImageUrl(r.image);
            return (
              <Avatar
                key={r.id}
                className="size-5 rounded-full ring-1 ring-background shrink-0"
              >
                {userPicture ? (
                  <AvatarImage src={userPicture} alt={r.name} />
                ) : null}
                <AvatarFallback className="rounded-full bg-primary/10 text-primary text-[8px] font-semibold">
                  {getInitials(r.name || r.email || r.id)}
                </AvatarFallback>
              </Avatar>
            );
          })}
          {count > 3 && (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-1 ring-background">
              +{count - 3}
            </span>
          )}
        </div>
      </button>
    );
  };

  const selectedRecruiter = useMemo(() => {
    return recruiters.find((r) => r.id === selectedRecruiterId);
  }, [recruiters, selectedRecruiterId]);

  const filteredRecruitersInHeader = useMemo(() => {
    const q = headerFilterSearch.toLowerCase().trim();
    if (!q) return recruiters;
    return recruiters.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [recruiters, headerFilterSearch]);

  const filteredModalRecruiters = useMemo(() => {
    if (!activeSlotModal) return [];
    const q = modalSearch.toLowerCase().trim();
    if (!q) return activeSlotModal.recruiters;
    return activeSlotModal.recruiters.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [activeSlotModal, modalSearch]);

  const formattedDateTitle = useMemo(() => {
    if (!activeSlotModal) return "";
    const str = format(activeSlotModal.date, "EEEE, d 'de' MMMM", {
      locale: pt,
    });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [activeSlotModal]);

  const stats = [
    {
      label: "Recrutadores Ativos",
      value: `${activeRecruitersThisWeek} / ${recruiters.length}`,
      description: "Com horários marcados esta semana",
      icon: Users,
    },
    {
      label: "Horas Disponíveis",
      value: `${totalHours}h`,
      description: "Total acumulado de disponibilidade",
      icon: Clock,
    },
    {
      label: "Slots Marcados",
      value: `${totalSlotsCount}`,
      description: "Intervalos de 30 minutos na semana",
      icon: UserCheck,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Disponibilidade da Equipa"
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
                  ? `Todos os Recrutadores (${recruiters.length})`
                  : selectedRecruiter?.name || "Recrutador"
              }
              aria-label={
                selectedRecruiterId === "all"
                  ? `Todos os Recrutadores (${recruiters.length})`
                  : selectedRecruiter?.name || "Recrutador"
              }
            >
              {selectedRecruiterId === "all" ? (
                <>
                  <Users className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="hidden md:inline truncate">
                    Todos os Recrutadores ({recruiters.length})
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
                    Todos os Recrutadores ({recruiters.length})
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

      {/* Stats Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader>
                <CardDescription className="text-xs uppercase tracking-wider font-medium">
                  {stat.label}
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {stat.value}
                </CardTitle>
                <CardAction>
                  <div className="rounded-lg p-2 bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                {stat.description}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ScheduleWeekGrid
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        minHour={minHour}
        maxHour={maxHour}
        renderCell={renderGridCell}
      />

      {/* Slot Recruiters Details Dialog */}
      <Dialog
        open={!!activeSlotModal}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSlotModal(null);
            setModalSearch("");
          }
        }}
      >
        {activeSlotModal && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Disponibilidade no Horário</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {formattedDateTitle} • {activeSlotModal.time} –{" "}
                {getEndTimeString(activeSlotModal.time, 30)} (
                {activeSlotModal.recruiters.length}{" "}
                {activeSlotModal.recruiters.length === 1
                  ? "recrutador disponível"
                  : "recrutadores disponíveis"}
                )
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-1">
              {/* Modal Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Pesquisar por nome ou email..."
                  className="h-8 pl-8 pr-2 text-xs"
                  autoFocus
                />
              </div>

              {/* Recruiter List */}
              <div className="max-h-60 overflow-y-auto space-y-0.5">
                {filteredModalRecruiters.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    {modalSearch
                      ? "Nenhum recrutador encontrado para esta pesquisa"
                      : "Nenhum recrutador disponível neste horário"}
                  </div>
                ) : (
                  filteredModalRecruiters.map((r) => {
                    const userPicture = getStableImageUrl(r.image);
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-2.5 rounded-md p-2 transition-colors hover:bg-muted/80"
                      >
                        <Avatar className="h-6 w-6 rounded-sm shrink-0">
                          {userPicture ? (
                            <AvatarImage src={userPicture} alt={r.name} />
                          ) : null}
                          <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-[10px] font-semibold">
                            {getInitials(r.name || r.email || r.id)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium text-xs truncate">
                            {r.name || "Sem nome"}
                          </span>
                          {r.email && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {r.email}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                          • Disponível
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
