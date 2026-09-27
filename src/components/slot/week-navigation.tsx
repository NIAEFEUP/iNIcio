"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";

interface WeekNavigationProps {
  weekStart: Date;
  weekEnd: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function WeekNavigation({
  weekStart,
  weekEnd,
  onPrevious,
  onNext,
  onToday,
}: WeekNavigationProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onPrevious}
        aria-label="Semana anterior"
      >
        <ChevronLeft />
        Anterior
      </Button>
      <span className="min-w-32 text-center text-sm text-muted-foreground">
        {format(weekStart, "dd/MM/yyyy")} - {format(weekEnd, "dd/MM/yyyy")}
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onNext}
        aria-label="Semana seguinte"
      >
        Seguinte
        <ChevronRight />
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onToday}>
        Hoje
      </Button>
    </div>
  );
}
