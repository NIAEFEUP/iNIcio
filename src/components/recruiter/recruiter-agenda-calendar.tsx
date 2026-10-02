"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { format, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import {
  CalendarDays,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  User,
  Users,
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
import type { RecruiterAgendaEvent } from "@/lib/calendar";
import { getInitials } from "@/lib/utils";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { cn } from "@/lib/utils";

interface RecruiterAgendaCalendarProps {
  events: RecruiterAgendaEvent[];
  recruiterName: string;
  isOwnAgenda: boolean;
}

export function RecruiterAgendaCalendar({
  events,
  recruiterName,
  isOwnAgenda,
}: RecruiterAgendaCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [viewFormat, setViewFormat] = useState<ViewMode>("grid");
  const [selectedEvent, setSelectedEvent] =
    useState<RecruiterAgendaEvent | null>(null);

  // Filter events for the 5-day work week (Mon-Fri)
  const weekEnd = useMemo(() => {
    const end = addDays(weekStart, 4);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  const currentWeekEvents = useMemo(() => {
    const startMs = weekStart.getTime();
    const endMs = weekEnd.getTime();
    return events.filter((e) => {
      const eventTime = e.start.getTime();
      return eventTime >= startMs && eventTime <= endMs;
    });
  }, [events, weekStart, weekEnd]);

  // Group events by "YYYY-MM-DD-HH:mm" for the grid view
  const eventsBySlot = useMemo(() => {
    const map = new Map<string, RecruiterAgendaEvent[]>();
    for (const evt of currentWeekEvents) {
      const d = evt.start;
      const datePart = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      const key = `${datePart}-${timePart}`;

      const existing = map.get(key) || [];
      existing.push(evt);
      map.set(key, existing);
    }
    return map;
  }, [currentWeekEvents]);

  const eventsByDay = useMemo(() => {
    const map = new Map<
      string,
      { date: Date; events: RecruiterAgendaEvent[] }
    >();
    const sorted = [...currentWeekEvents].sort(
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
  }, [currentWeekEvents]);

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

  const interviewCount = useMemo(
    () => currentWeekEvents.filter((e) => e.type === "interview").length,
    [currentWeekEvents],
  );

  const dynamicCount = useMemo(
    () => currentWeekEvents.filter((e) => e.type === "dynamic").length,
    [currentWeekEvents],
  );

  const stats = [
    {
      label: "Eventos na Semana",
      value: `${currentWeekEvents.length}`,
      description: `${interviewCount} entrevistas • ${dynamicCount} dinâmicas`,
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
      description: "Sessões de dinâmica atribuídas",
      icon: Users,
    },
  ];

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

          return (
            <button
              key={evt.id}
              type="button"
              onClick={() => setSelectedEvent(evt)}
              className={cn(
                "group flex w-full flex-col gap-1 rounded-md border p-1.5 text-left transition-all shadow-2xs hover:shadow-xs",
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
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {format(evt.start, "HH:mm")}
                </span>
              </div>

              {isInterview ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  {evt.candidate ? (
                    <>
                      <Avatar className="size-4 shrink-0 ring-1 ring-border">
                        <AvatarImage
                          src={
                            getStableImageUrl(evt.candidate.image) || undefined
                          }
                          alt={evt.candidate.name}
                        />
                        <AvatarFallback>
                          <InitialsAvatar
                            initials={getInitials(evt.candidate.name)}
                            size="sm"
                            className="size-4 text-[7px]"
                          />
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-xs font-medium text-foreground">
                        {evt.candidate.name}
                      </span>
                    </>
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={isOwnAgenda ? "A Minha Agenda" : `Agenda — ${recruiterName}`}
        viewModeToggle={
          <ViewModeToggle
            viewMode={viewFormat}
            onViewModeChange={setViewFormat}
            listLabel="Lista"
            gridLabel="Grelha"
          />
        }
        actions={
          <WeekNavigator weekStart={weekStart} onWeekChange={setWeekStart} />
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
          renderCell={renderGridCell}
        />
      ) : (
        /* Timeline List View */
        <div className="flex flex-col gap-6">
          {eventsByDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
              <CalendarIcon className="size-10 text-muted-foreground mb-3 opacity-40" />
              <h3 className="font-semibold text-sm">Sem eventos agendados</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Não existem entrevistas ou dinâmicas marcadas para esta semana.
              </p>
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
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
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
                                {format(evt.end, "HH:mm")}
                              </span>
                            </div>

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
                                      ? "candidato"
                                      : "candidatos"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {isInterview ? (
                              <Button
                                variant="outline"
                                size="sm"
                                nativeButton={false}
                                render={<Link href={evt.link} />}
                                className="gap-1.5 text-xs"
                              >
                                <ExternalLink className="size-3.5" />
                                <span>Abrir Entrevista</span>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                nativeButton={false}
                                render={<Link href={evt.link} />}
                                className="gap-1.5 text-xs"
                              >
                                <ExternalLink className="size-3.5" />
                                <span>Abrir Dinâmica</span>
                              </Button>
                            )}
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
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      >
        {selectedEvent && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              {/* 1. Type of event */}
              <DialogTitle className="text-base font-semibold">
                {selectedEvent.type === "interview" ? "Entrevista" : "Dinâmica"}
              </DialogTitle>
              {/* 2. Date and time */}
              <DialogDescription className="text-xs text-muted-foreground">
                <span className="capitalize">
                  {format(selectedEvent.start, "EEEE, d 'de' MMMM 'de' yyyy", {
                    locale: pt,
                  })}
                </span>
                {" · "}
                <span>
                  {format(selectedEvent.start, "HH:mm")} –{" "}
                  {format(selectedEvent.end, "HH:mm")} ({selectedEvent.duration}{" "}
                  min)
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              {/* 3. Recruiters assigned to that event */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recrutadores
                </span>
                {selectedEvent.recruiters &&
                selectedEvent.recruiters.length > 0 ? (
                  <div className="divide-y divide-border rounded-lg border bg-muted/20">
                    {selectedEvent.recruiters.map((recruiter) => (
                      <div
                        key={recruiter.id}
                        className="flex items-center gap-2.5 p-2.5"
                      >
                        <Avatar className="size-7 shrink-0">
                          <AvatarImage
                            src={
                              getStableImageUrl(recruiter.image) || undefined
                            }
                            alt={recruiter.name}
                          />
                          <AvatarFallback className="text-[10px] font-medium">
                            {getInitials(recruiter.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground truncate">
                          {recruiter.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic px-0.5">
                    Nenhum recrutador atribuído
                  </p>
                )}
              </div>

              {/* 4. Candidate(s) */}
              {selectedEvent.type === "interview" ? (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Candidato
                  </span>
                  {selectedEvent.candidate ? (
                    <div className="flex items-center justify-between gap-2.5 rounded-lg border bg-muted/20 p-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="size-8 shrink-0">
                          <AvatarImage
                            src={
                              getStableImageUrl(
                                selectedEvent.candidate.image,
                              ) || undefined
                            }
                            alt={selectedEvent.candidate.name}
                          />
                          <AvatarFallback className="text-xs font-medium">
                            {getInitials(selectedEvent.candidate.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-foreground truncate">
                            {selectedEvent.candidate.name}
                          </span>
                          {selectedEvent.candidate.email && (
                            <span className="text-[11px] text-muted-foreground truncate">
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
                      Nenhum candidato atribuído
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Candidatos (
                    {selectedEvent.candidates?.length ??
                      selectedEvent.candidatesCount ??
                      0}
                    )
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
                            <Avatar className="size-7 shrink-0">
                              <AvatarImage
                                src={getStableImageUrl(cand.image) || undefined}
                                alt={cand.name}
                              />
                              <AvatarFallback className="text-[10px] font-medium">
                                {getInitials(cand.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium text-foreground truncate">
                                {cand.name}
                              </span>
                              {cand.email && (
                                <span className="text-[11px] text-muted-foreground truncate">
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
                      Nenhum candidato inscrito
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                nativeButton={false}
                render={<Link href={selectedEvent.link} />}
                className="gap-1.5 w-full sm:w-auto"
              >
                <span>
                  {selectedEvent.type === "interview"
                    ? "Abrir Entrevista"
                    : "Abrir Dinâmica"}
                </span>
                <ExternalLink className="size-3.5" />
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
