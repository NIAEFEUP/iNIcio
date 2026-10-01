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
import { Badge } from "@/components/ui/badge";
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

  // Pre-calculate minimum and maximum hours based on events in this week
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
          return (
            <button
              key={evt.id}
              type="button"
              onClick={() => setSelectedEvent(evt)}
              className={cn(
                "group flex w-full flex-col gap-1 rounded-md border p-1.5 text-left transition-all shadow-2xs hover:shadow-xs",
                isInterview
                  ? "border-blue-500/30 bg-blue-50/80 hover:bg-blue-100/90 dark:border-blue-800/60 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
                  : "border-emerald-500/30 bg-emerald-50/80 hover:bg-emerald-100/90 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50",
              )}
            >
              <div className="flex w-full items-center justify-between gap-1">
                <Badge
                  variant={isInterview ? "secondary" : "outline"}
                  className={cn(
                    "text-[10px] px-1 py-0 font-medium",
                    isInterview
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
                  )}
                >
                  {isInterview ? "Entrevista" : "Dinâmica"}
                </Badge>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {format(evt.start, "HH:mm")}
                </span>
              </div>

              <div className="flex items-center gap-1.5 min-w-0">
                {evt.candidate && (
                  <Avatar className="size-4 shrink-0 ring-1 ring-card">
                    <AvatarImage
                      src={getStableImageUrl(evt.candidate.image) || undefined}
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
                )}
                <span className="truncate text-xs font-semibold text-foreground">
                  {evt.title}
                </span>
              </div>
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
        /* List View */
        <div className="flex flex-col gap-3">
          {currentWeekEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
              <CalendarIcon className="size-10 text-muted-foreground mb-3 opacity-40" />
              <h3 className="font-semibold text-sm">Sem eventos agendados</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Não existem entrevistas ou dinâmicas marcadas para esta semana.
              </p>
            </div>
          ) : (
            currentWeekEvents
              .sort((a, b) => a.start.getTime() - b.start.getTime())
              .map((evt) => {
                const isInterview = evt.type === "interview";
                return (
                  <div
                    key={evt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-2xs hover:border-foreground/20 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                          isInterview
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {format(evt.start, "d MMM", { locale: pt })}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {evt.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-normal"
                          >
                            {isInterview ? "Entrevista" : "Dinâmica"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {format(evt.start, "HH:mm")} –{" "}
                            {format(evt.end, "HH:mm")}
                          </span>
                          {evt.candidate && (
                            <span>Candidato: {evt.candidate.name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {evt.candidate && (
                        <Button
                          variant="outline"
                          size="sm"
                          render={
                            <Link href={`/candidate/${evt.candidate.id}`} />
                          }
                          className="gap-1.5 text-xs"
                        >
                          <ExternalLink className="size-3.5" />
                          <span>Ver Perfil</span>
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
                );
              })
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
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={
                    selectedEvent.type === "interview" ? "secondary" : "outline"
                  }
                  className={cn(
                    "text-xs",
                    selectedEvent.type === "interview"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
                  )}
                >
                  {selectedEvent.type === "interview"
                    ? "Entrevista Individual"
                    : "Dinâmica de Grupo"}
                </Badge>
              </div>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
              <DialogDescription>
                {format(selectedEvent.start, "EEEE, d 'de' MMMM 'de' yyyy", {
                  locale: pt,
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-4 text-foreground/70" />
                <span className="font-medium text-foreground">Horário:</span>
                <span>
                  {format(selectedEvent.start, "HH:mm")} –{" "}
                  {format(selectedEvent.end, "HH:mm")} (
                  {Math.round(
                    (selectedEvent.end.getTime() -
                      selectedEvent.start.getTime()) /
                      60_000,
                  )}{" "}
                  minutos)
                </span>
              </div>

              {selectedEvent.candidate && (
                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-9">
                      <AvatarImage
                        src={
                          getStableImageUrl(selectedEvent.candidate.image) ||
                          undefined
                        }
                        alt={selectedEvent.candidate.name}
                      />
                      <AvatarFallback>
                        <InitialsAvatar
                          initials={getInitials(selectedEvent.candidate.name)}
                          size="sm"
                        />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">
                        {selectedEvent.candidate.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {selectedEvent.candidate.email}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link href={`/candidate/${selectedEvent.candidate.id}`} />
                    }
                    className="text-xs gap-1"
                  >
                    <ExternalLink className="size-3" />
                    <span>Perfil</span>
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEvent(null)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
