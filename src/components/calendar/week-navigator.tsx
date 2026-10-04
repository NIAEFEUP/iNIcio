"use client";

import React from "react";
import { addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getMonday, formatWeekRange } from "@/lib/date";
import { cn } from "@/lib/utils";

export interface WeekNavigatorProps {
  weekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
  className?: string;
}

export function WeekNavigator({
  weekStart,
  onWeekChange,
  className,
}: WeekNavigatorProps) {
  const weekEnd = addDays(weekStart, 4);

  const moveWeek = (amount: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + amount * 7);
    onWeekChange(next);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg border bg-card p-[0.5] shadow-2xs",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0"
        onClick={() => onWeekChange(getMonday(new Date()))}
      >
        Hoje
      </Button>
      <Separator orientation="vertical" className="h-4 shrink-0" />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        onClick={() => moveWeek(-1)}
        aria-label="Semana anterior"
        title="Semana anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-28 flex-1 text-center text-xs font-medium text-muted-foreground px-2 select-none capitalize">
        {formatWeekRange(weekStart, weekEnd)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        onClick={() => moveWeek(1)}
        aria-label="Semana seguinte"
        title="Semana seguinte"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
