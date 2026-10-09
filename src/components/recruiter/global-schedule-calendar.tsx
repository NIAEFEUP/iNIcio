"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { format, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import {
  CalendarDays,
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  Clock,
  ExternalLink,
  Search,
  User,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  DialogFooter,
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
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/data-table/view-mode-toggle";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ScheduleWeekGrid,
  WeekNavigator,
  getMonday,
} from "@/components/calendar/schedule-week-grid";
import type { RecruiterAgendaEvent, TeamRecruiter } from "@/lib/calendar";
import { getInitials } from "@/lib/utils";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { cn } from "@/lib/utils";

interface GlobalScheduleCalendarProps {
  events: RecruiterAgendaEvent[];
  recruiters: TeamRecruiter[];
  currentUserId?: string;
}

export function GlobalScheduleCalendar({
  events,
  recruiters,
  currentUserId,
}: GlobalScheduleCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [viewFormat, setViewFormat] = useState<ViewMode>("grid");
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>(() =>
    currentUserId ? "my" : "all",
  );
  const [eventTypeFilter, setEventTypeFilter] = useState<
    "all" | "interview" | "dynamic"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [headerFilterOpen, setHeaderFilterOpen] = useState(false);
  const [headerFilterSearch, setHeaderFilterSearch] = useState("");
  const [selectedEvent, setSelectedEvent] =
    useState<RecruiterAgendaEvent | null>(null);

  // 5-day work week (Monday to Friday)
  const weekEnd = useMemo(() => {
    const end = addDays(weekStart, 4);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  // All events within the current week (unfiltered)
  const currentWeekEvents = useMemo(() => {
    const startMs = weekStart.getTime();
    const endMs = weekEnd.getTime();
    return events.filter((e) => {
      const eventTime = e.start.getTime();
      return eventTime >= startMs && eventTime <= endMs;
    });
  }, [events, weekStart, weekEnd]);

  // Events in current week filtered by selected recruiter
  const recruiterFilteredEvents = useMemo(() => {
    return currentWeekEvents.filter((evt) => {
      // Recruiter filter
      if (selectedRecruiterId === "my") {
        if (!evt.recruiters?.some((r) => r.id === currentUserId)) {
          return false;
        }
      } else if (selectedRecruiterId !== "all") {
        if (!evt.recruiters?.some((r) => r.id === selectedRecruiterId)) {
          return false;
        }
      }
      return true;
    });
  }, [currentWeekEvents, selectedRecruiterId, currentUserId]);

  // Filtered events based on all UI controls (recruiter + eventType + search)
  const filteredEvents = useMemo(() => {
    return recruiterFilteredEvents.filter((evt) => {
      // Event type filter
      if (eventTypeFilter !== "all" && evt.type !== eventTypeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchInterviewCandidate =
          evt.candidate?.name?.toLowerCase().includes(q) ||
          evt.candidate?.email?.toLowerCase().includes(q);
        const matchDynamicCandidate = evt.candidates?.some(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q),
        );
        const matchRecruiter = evt.recruiters?.some((r) =>
          r.name?.toLowerCase().includes(q),
        );
        if (
          !matchInterviewCandidate &&
          !matchDynamicCandidate &&
          !matchRecruiter
        ) {
          return false;
        }
      }

      return true;
    });
  }, [recruiterFilteredEvents, eventTypeFilter, searchQuery]);

  // Group filtered events by "YYYY-MM-DD-HH:mm" for the grid view
  const eventsBySlot = useMemo(() => {
    const map = new Map<string, RecruiterAgendaEvent[]>();
    for (const evt of filteredEvents) {
      const d = evt.start;
      const datePart = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      const key = `${datePart}-${timePart}`;

      const existing = map.get(key) || [];
      existing.push(evt);
      map.set(key, existing);
    }
    return map;
  }, [filteredEvents]);

  // Group filtered events by day for timeline list view
  const eventsByDay = useMemo(() => {
    const map = new Map<
      string,
      { date: Date; events: RecruiterAgendaEvent[] }
    >();
    const sorted = [...filteredEvents].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    for (const evt of sorted) {
      const key = `${evt.start.getFullYear()}-${(evt.start.getMonth() + 1).toString().padStart(2, "0")}-${evt.start.getDate().toString().padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, { date: evt.start, events: [] });
      }
      map.get(key)!.events.push(evt);
    }

    return Array.from(map.values());
  }, [filteredEvents]);

  // Calculate min and max hour for grid display
  const { minHour, maxHour } = useMemo(() => {
    let min = 9;
    let max = 19;
    for (const evt of currentWeekEvents) {
      const h = evt.start.getHours();
      const endH = evt.end.getHours();
      if (h < min) min = h;
      if (endH > max) max = endH;
    }
    return { minHour: min, maxHour: max };
  }, [currentWeekEvents]);

  // Week statistics under selected recruiter filter
  const allCount = recruiterFilteredEvents.length;

  const interviewCount = useMemo(
    () => recruiterFilteredEvents.filter((e) => e.type === "interview").length,
    [recruiterFilteredEvents],
  );

  const dynamicCount = useMemo(
    () => recruiterFilteredEvents.filter((e) => e.type === "dynamic").length,
    [recruiterFilteredEvents],
  );

  const myEventsThisWeekCount = useMemo(() => {
    if (!currentUserId) return 0;
    return currentWeekEvents.filter((e) =>
      e.recruiters?.some((r) => r.id === currentUserId),
    ).length;
  }, [currentWeekEvents, currentUserId]);

  const stats = [
    {
      label: "Eventos na Semana",
      value: `${allCount}`,
      description: `${interviewCount} entrevistas · ${dynamicCount} dinâmicas`,
      icon: CalendarDays,
    },
    {
      label: "Entrevistas",
      value: `${interviewCount}`,
      description: "Entrevistas individuais agendadas",
      icon: User,
    },
    {
      label: "Dinâmicas de Grupo",
      value: `${dynamicCount}`,
      description: "Sessões de dinâmica de grupo agendadas",
      icon: Users,
    },
  ];

  const selectedRecruiter = useMemo(() => {
    if (selectedRecruiterId === "all" || selectedRecruiterId === "my")
      return null;
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

  const defaultRecruiterId = currentUserId ? "my" : "all";
  const hasActiveFilters =
    selectedRecruiterId !== defaultRecruiterId ||
    eventTypeFilter !== "all" ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setSelectedRecruiterId(defaultRecruiterId);
    setEventTypeFilter("all");
    setSearchQuery("");
  };

  const renderGridCell = (date: Date, time: string) => {
    const datePart = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    const key = `${datePart}-${time}`;
    const cellEvents = eventsBySlot.get(key);

    if (!cellEvents || cellEvents.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-col gap-1 w-full h-full">
        {cellEvents.map((evt) => {
          const isInterview = evt.type === "interview";
          const dynamicCandidateCount =
            evt.candidatesCount ?? evt.candidates?.length ?? 0;
          const recruitersCount = evt.recruiters?.length ?? 0;

          return (
            <button
              key={evt.id}
              type="button"
              onClick={() => setSelectedEvent(evt)}
              className={cn(
                "group flex w-full flex-col gap-1 rounded-md border p-1.5 text-left transition-all shadow-2xs hover:shadow-xs cursor-pointer select-none",
                isInterview
                  ? "border-blue-500/25 bg-blue-50/70 hover:bg-blue-100/80 dark:border-blue-800/40 dark:bg-blue-950/25 dark:hover:bg-blue-950/45"
                  : "border-emerald-500/25 bg-emerald-50/70 hover:bg-emerald-100/80 dark:border-emerald-800/40 dark:bg-emerald-950/25 dark:hover:bg-emerald-950/45",
              )}
            >
              <div className="flex w-full items-center justify-between gap-1 leading-none">
                <span
                  className={cn(
                    "text-[11px] font-semibold tracking-tight",
                    isInterview
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-emerald-700 dark:text-emerald-300",
                  )}
                >
                  {isInterview ? "Entrevista" : "Dinâmica"}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                  <Users className="size-2.5 opacity-70" />
                  <span>{recruitersCount}</span>
                </span>
              </div>

              {isInterview ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  {evt.candidate ? (
                    <span className="truncate text-xs font-medium text-foreground">
                      {evt.candidate.name}
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
                    {dynamicCandidateCount === 1 ? "candidato" : "candidatos"}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const calendarToolbarPrepend = (
    <div className="flex flex-wrap items-center gap-2">
      {/* Event Type Filter Button Group */}
      <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
        <Button
          type="button"
          size="sm"
          variant={eventTypeFilter === "all" ? "secondary" : "ghost"}
          onClick={() => setEventTypeFilter("all")}
        >
          <span>Todos</span>
          <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground">
            {allCount}
          </span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={eventTypeFilter === "interview" ? "secondary" : "ghost"}
          onClick={() => setEventTypeFilter("interview")}
        >
          <span className="size-2 rounded-full bg-blue-500 mr-1.5" />
          <span>Entrevistas</span>
          <span className="ml-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 text-[10px] font-semibold">
            {interviewCount}
          </span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={eventTypeFilter === "dynamic" ? "secondary" : "ghost"}
          onClick={() => setEventTypeFilter("dynamic")}
        >
          <span className="size-2 rounded-full bg-emerald-500 mr-1.5" />
          <span>Dinâmicas</span>
          <span className="ml-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-semibold">
            {dynamicCount}
          </span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-52">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar..."
          className="h-8 pl-8 pr-7 text-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpar pesquisa"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Clear Filter Button */}
      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={resetFilters}
          className="text-xs text-muted-foreground hover:text-foreground gap-1 h-7"
        >
          <X className="size-3" />
          <span>Limpar</span>
        </Button>
      )}
    </div>
  );

  const calendarToolbarActions = (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-xs border border-blue-500 bg-blue-100 dark:bg-blue-900/60" />
        <span>Entrevista</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-xs border border-emerald-500 bg-emerald-100 dark:bg-emerald-900/60" />
        <span>Dinâmica</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Agenda"
        viewModeToggle={
          <div className="flex items-center gap-2">
            <ViewModeToggle
              viewMode={viewFormat}
              onViewModeChange={setViewFormat}
              listLabel="Lista"
              gridLabel="Grelha"
            />
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
                    : selectedRecruiterId === "my"
                      ? "Minhas Sessões"
                      : selectedRecruiter?.name || "Recrutador"
                }
                aria-label="Filtrar por recrutador"
              >
                {selectedRecruiterId === "all" ? (
                  <>
                    <Users className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="hidden md:inline truncate">
                      Todos os Recrutadores ({recruiters.length})
                    </span>
                  </>
                ) : selectedRecruiterId === "my" ? (
                  <>
                    <User className="size-3.5 text-primary shrink-0" />
                    <span className="hidden md:inline truncate font-medium">
                      Minhas Sessões
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

                  {currentUserId && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedRecruiterId("my");
                        setHeaderFilterOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm cursor-pointer",
                        selectedRecruiterId === "my" && "bg-accent font-medium",
                      )}
                    >
                      <User className="size-3.5 text-primary shrink-0" />
                      <span className="flex-1 truncate">
                        Minhas Sessões ({myEventsThisWeekCount})
                      </span>
                      {selectedRecruiterId === "my" && (
                        <Check className="size-3.5 text-primary shrink-0" />
                      )}
                    </DropdownMenuItem>
                  )}

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
          </div>
        }
        actions={
          <WeekNavigator
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            className="w-full md:w-auto"
          />
        }
      />

      {/* Stats summary cards */}
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

      {viewFormat === "grid" ? (
        <ScheduleWeekGrid
          weekStart={weekStart}
          onWeekChange={setWeekStart}
          minHour={minHour}
          maxHour={maxHour}
          headerPrepend={calendarToolbarPrepend}
          actions={calendarToolbarActions}
          renderCell={renderGridCell}
        />
      ) : (
        /* Timeline List View */
        <div className="flex flex-col gap-6">
          {/* Integrated Toolbar Header in List View */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="bg-muted/20 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {calendarToolbarPrepend}
                {calendarToolbarActions}
              </div>
            </div>
          </div>

          {eventsByDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
              <CalendarIcon className="size-10 text-muted-foreground mb-3 opacity-40" />
              <h3 className="font-semibold text-sm">
                {hasActiveFilters
                  ? "Nenhum evento corresponde aos filtros"
                  : "Sem eventos agendados"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {hasActiveFilters
                  ? "Experimenta ajustar os filtros de recrutador, tipo de evento ou termo de pesquisa."
                  : "Não existem entrevistas ou dinâmicas marcadas para esta semana."}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="mt-4 text-xs"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            eventsByDay.map((group) => (
              <div
                key={group.date.toISOString()}
                className="flex flex-col gap-3"
              >
                {/* Day Date Header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <CalendarIcon className="size-3.5 text-primary" />
                    <span className="capitalize">
                      {format(group.date, "EEEE, d 'de' MMMM", { locale: pt })}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Timeline Items */}
                <div className="relative pl-6 space-y-3 pb-2">
                  {group.events.length > 1 && (
                    <div className="absolute left-[5px] top-[24px] bottom-[24px] w-0.5 bg-border" />
                  )}
                  {group.events.map((evt) => {
                    const isInterview = evt.type === "interview";
                    const dynamicCandidateCount =
                      evt.candidatesCount ?? evt.candidates?.length ?? 0;
                    const recruitersCount = evt.recruiters?.length ?? 0;

                    return (
                      <div key={evt.id} className="relative group">
                        {/* Timeline dot */}
                        <div
                          className={cn(
                            "absolute -left-6 top-[18px] size-3 rounded-full border-2 bg-background transition-transform group-hover:scale-125 z-10",
                            isInterview
                              ? "border-blue-500 ring-2 ring-blue-500/20"
                              : "border-emerald-500 ring-2 ring-emerald-500/20",
                          )}
                        />

                        {/* Event Card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-2xs hover:border-foreground/20 hover:shadow-xs transition-all">
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "text-xs font-semibold uppercase tracking-wider",
                                  isInterview
                                    ? "text-blue-700 dark:text-blue-300"
                                    : "text-emerald-700 dark:text-emerald-300",
                                )}
                              >
                                {isInterview ? "Entrevista" : "Dinâmica"}
                              </span>
                              <span className="text-muted-foreground/60 text-xs">
                                •
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                <Clock className="size-3" />
                                {format(evt.start, "HH:mm")} –{" "}
                                {format(evt.end, "HH:mm")} ({evt.duration} min)
                              </span>
                            </div>

                            {/* Candidate info */}
                            <div className="flex items-center gap-2">
                              {isInterview ? (
                                evt.candidate ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="size-5 shrink-0 ring-1 ring-border">
                                      <AvatarImage
                                        src={
                                          getStableImageUrl(
                                            evt.candidate.image,
                                          ) || undefined
                                        }
                                        alt={evt.candidate.name}
                                      />
                                      <AvatarFallback>
                                        <InitialsAvatar
                                          initials={getInitials(
                                            evt.candidate.name,
                                          )}
                                          size="sm"
                                          className="size-5 text-[9px]"
                                        />
                                      </AvatarFallback>
                                    </Avatar>
                                    <Link
                                      href={`/candidate/${evt.candidate.id}`}
                                      className="text-sm font-medium text-foreground hover:underline"
                                    >
                                      {evt.candidate.name}
                                    </Link>
                                    {evt.candidate.email && (
                                      <span className="text-xs text-muted-foreground hidden md:inline">
                                        ({evt.candidate.email})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    Sem candidato
                                  </span>
                                )
                              ) : (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Users className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span className="text-sm font-medium text-foreground">
                                    {dynamicCandidateCount}{" "}
                                    {dynamicCandidateCount === 1
                                      ? "candidato inscrito"
                                      : "candidatos inscritos"}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Assigned recruiters row */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-medium text-[11px] uppercase tracking-wider text-muted-foreground/80">
                                Recrutadores:
                              </span>
                              {recruitersCount > 0 ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {evt.recruiters.map((r) => (
                                    <div
                                      key={r.id}
                                      className="flex items-center gap-1 rounded-md border bg-muted/30 px-1.5 py-0.5"
                                    >
                                      <Avatar className="size-3.5 rounded-full shrink-0">
                                        <AvatarImage
                                          src={
                                            getStableImageUrl(r.image) ||
                                            undefined
                                          }
                                          alt={r.name}
                                        />
                                        <AvatarFallback className="text-[6px] font-bold">
                                          {getInitials(r.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-[11px] font-medium text-foreground">
                                        {r.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  Sem recrutador atribuído
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              nativeButton={false}
                              render={<Link href={evt.link} />}
                              className="gap-1.5 text-xs"
                            >
                              <ExternalLink className="size-3.5" />
                              <span>
                                {isInterview
                                  ? "Abrir Entrevista"
                                  : "Abrir Dinâmica"}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEvent(evt)}
                              className="text-xs"
                            >
                              Detalhes
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Event Details Dialog */}
      <Dialog
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      >
        {selectedEvent &&
          (() => {
            const isInterview = selectedEvent.type === "interview";
            const dynamicCandidateCount =
              selectedEvent.candidatesCount ??
              selectedEvent.candidates?.length ??
              0;
            const sessionTypeLabel = isInterview ? "Entrevista" : "Dinâmica";
            const candidateLabel = isInterview
              ? selectedEvent.candidate?.name || "Sem candidato"
              : `${dynamicCandidateCount} ${dynamicCandidateCount === 1 ? "candidato" : "candidatos"}`;
            const formattedDateRaw = format(
              selectedEvent.start,
              "EEE, d 'de' MMM",
              {
                locale: pt,
              },
            );
            const formattedDate =
              formattedDateRaw.charAt(0).toUpperCase() +
              formattedDateRaw.slice(1);
            const formattedTimeRange = `${format(selectedEvent.start, "HH:mm")} – ${format(selectedEvent.end, "HH:mm")}`;

            return (
              <DialogContent className="sm:max-w-xl md:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {isInterview
                      ? selectedEvent.candidate
                        ? selectedEvent.candidate.name
                        : "Entrevista"
                      : `Dinâmica #${selectedEvent.id}`}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {sessionTypeLabel} · {candidateLabel} · {formattedDate},{" "}
                    {formattedTimeRange} ({selectedEvent.duration} min)
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                  {/* Candidate(s) Section */}
                  {isInterview ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Candidato
                      </span>
                      {selectedEvent.candidate ? (
                        <div className="flex items-center justify-between gap-2.5 rounded-lg border bg-muted/20 p-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="size-7 rounded-sm shrink-0">
                              {selectedEvent.candidate.image ? (
                                <AvatarImage
                                  src={
                                    getStableImageUrl(
                                      selectedEvent.candidate.image,
                                    ) || undefined
                                  }
                                  alt={selectedEvent.candidate.name}
                                />
                              ) : null}
                              <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-[9px] font-semibold">
                                {getInitials(
                                  selectedEvent.candidate.name ||
                                    selectedEvent.candidate.email ||
                                    "",
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium text-foreground truncate">
                                {selectedEvent.candidate.name}
                              </span>
                              {selectedEvent.candidate.email && (
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {selectedEvent.candidate.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="xs"
                            nativeButton={false}
                            render={
                              <Link
                                href={`/candidate/${selectedEvent.candidate.id}`}
                              />
                            }
                            className="text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1"
                          >
                            <span>Perfil</span>
                            <ExternalLink className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic px-0.5">
                          Nenhum candidato inscrito
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Candidatos Inscritos ({dynamicCandidateCount})
                      </span>
                      {selectedEvent.candidates &&
                      selectedEvent.candidates.length > 0 ? (
                        <div className="divide-y divide-border rounded-lg border bg-muted/20 max-h-48 overflow-y-auto">
                          {selectedEvent.candidates.map((cand) => (
                            <div
                              key={cand.id}
                              className="flex items-center justify-between gap-2.5 p-2.5"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar className="size-6 rounded-sm shrink-0">
                                  {cand.image ? (
                                    <AvatarImage
                                      src={
                                        getStableImageUrl(cand.image) ||
                                        undefined
                                      }
                                      alt={cand.name}
                                    />
                                  ) : null}
                                  <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-[8px] font-semibold">
                                    {getInitials(cand.name || cand.email || "")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-medium text-foreground truncate">
                                    {cand.name}
                                  </span>
                                  {cand.email && (
                                    <span className="text-[10px] text-muted-foreground truncate">
                                      {cand.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="xs"
                                nativeButton={false}
                                render={<Link href={`/candidate/${cand.id}`} />}
                                className="text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1"
                              >
                                <span>Perfil</span>
                                <ExternalLink className="size-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic px-0.5">
                          Nenhum candidato inscrito nesta dinâmica
                        </p>
                      )}
                    </div>
                  )}

                  {/* Recruiters Assigned Section */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Recrutadores Atribuídos (
                      {selectedEvent.recruiters?.length ?? 0})
                    </span>
                    {selectedEvent.recruiters &&
                    selectedEvent.recruiters.length > 0 ? (
                      <div className="divide-y divide-border rounded-lg border bg-muted/20 max-h-56 overflow-y-auto">
                        {selectedEvent.recruiters.map((recruiter) => (
                          <div
                            key={recruiter.id}
                            className="flex items-center justify-between gap-2.5 p-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar className="size-6 rounded-sm shrink-0">
                                {recruiter.image ? (
                                  <AvatarImage
                                    src={
                                      getStableImageUrl(recruiter.image) ||
                                      undefined
                                    }
                                    alt={recruiter.name}
                                  />
                                ) : null}
                                <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-[8px] font-semibold">
                                  {getInitials(
                                    recruiter.name || recruiter.email || "",
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-medium text-foreground truncate">
                                  {recruiter.name}
                                </span>
                                {recruiter.email && (
                                  <span className="text-[10px] text-muted-foreground truncate">
                                    {recruiter.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic px-0.5">
                        Nenhum recrutador atribuído
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter className="pt-2 border-t border-border/50">
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href={selectedEvent.link} />}
                    className="gap-1.5 text-xs w-full sm:w-auto"
                  >
                    <span>
                      {isInterview ? "Abrir Entrevista" : "Abrir Dinâmica"}
                    </span>
                    <ExternalLink className="size-3.5" />
                  </Button>
                </DialogFooter>
              </DialogContent>
            );
          })()}
      </Dialog>
    </div>
  );
}
