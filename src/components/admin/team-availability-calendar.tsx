"use client";

import React, { useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarClock, Clock, UserCheck, Users } from "lucide-react";

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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { InitialsAvatar } from "@/components/common/initials-avatar";
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
  const [activeSlotModal, setActiveSlotModal] = useState<{
    date: Date;
    time: string;
    recruiters: TeamRecruiter[];
  } | null>(null);

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

    // Intensity styling based on availability count
    const intensityClass =
      count === 1
        ? "border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100/90 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
        : count === 2
          ? "border-teal-300 bg-teal-50/90 hover:bg-teal-100 dark:border-teal-800/80 dark:bg-teal-950/40 dark:hover:bg-teal-950/60"
          : "border-primary/40 bg-primary/10 hover:bg-primary/15 dark:border-primary/50 dark:bg-primary/20 dark:hover:bg-primary/25";

    return (
      <button
        type="button"
        onClick={() =>
          setActiveSlotModal({ date, time, recruiters: slotRecruiters })
        }
        className={cn(
          "group flex w-full flex-col gap-1 rounded-md border p-1.5 text-left transition-all shadow-2xs hover:shadow-xs",
          intensityClass,
        )}
      >
        <div className="flex w-full items-center justify-between gap-1">
          <Badge
            variant="secondary"
            className="text-[10px] px-1 py-0 font-medium"
          >
            {count} {count === 1 ? "disponível" : "disponíveis"}
          </Badge>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {time}
          </span>
        </div>

        {/* Recruiter Avatar Stack */}
        <div className="flex items-center -space-x-1.5 mt-0.5 overflow-hidden">
          {slotRecruiters.slice(0, 3).map((r) => (
            <Avatar key={r.id} size="sm" className="size-5 ring-1 ring-card">
              <AvatarImage
                src={getStableImageUrl(r.image) || undefined}
                alt={r.name}
              />
              <AvatarFallback>
                <InitialsAvatar
                  initials={getInitials(r.name)}
                  size="sm"
                  className="size-5 text-[8px]"
                />
              </AvatarFallback>
            </Avatar>
          ))}
          {count > 3 && (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-1 ring-card">
              +{count - 3}
            </span>
          )}
        </div>
      </button>
    );
  };

  const selectedRecruiterLabel = useMemo(() => {
    if (selectedRecruiterId === "all") {
      return `Todos os Recrutadores (${recruiters.length})`;
    }
    return (
      recruiters.find((r) => r.id === selectedRecruiterId)?.name || "Recrutador"
    );
  }, [selectedRecruiterId, recruiters]);

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
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <WeekNavigator weekStart={weekStart} onWeekChange={setWeekStart} />

            <Select
              value={selectedRecruiterId}
              onValueChange={(val) => {
                if (val) setSelectedRecruiterId(val);
              }}
            >
              <SelectTrigger className="w-56 h-8 text-xs">
                <SelectValue placeholder="Filtrar por recrutador">
                  {selectedRecruiterLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todos os Recrutadores ({recruiters.length})
                </SelectItem>
                {recruiters.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          if (!open) setActiveSlotModal(null);
        }}
      >
        {activeSlotModal && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                >
                  <CalendarClock className="size-3 mr-1" />
                  {activeSlotModal.recruiters.length}{" "}
                  {activeSlotModal.recruiters.length === 1
                    ? "recrutador disponível"
                    : "recrutadores disponíveis"}
                </Badge>
              </div>
              <DialogTitle>
                {format(activeSlotModal.date, "EEEE, d 'de' MMMM", {
                  locale: pt,
                })}
              </DialogTitle>
              <DialogDescription>
                Horário: {activeSlotModal.time} —{" "}
                {getEndTimeString(activeSlotModal.time, 30)} (30 minutos)
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 py-2 max-h-72 overflow-y-auto">
              {activeSlotModal.recruiters.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border p-2.5 bg-background shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarImage
                        src={getStableImageUrl(r.image) || undefined}
                        alt={r.name}
                      />
                      <AvatarFallback>
                        <InitialsAvatar
                          initials={getInitials(r.name)}
                          size="sm"
                        />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold">{r.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Disponível
                  </Badge>
                </div>
              ))}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
