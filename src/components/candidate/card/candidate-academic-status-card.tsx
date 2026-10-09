"use client";

import { Building2, Calendar, GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CandidateAcademicStatusCardProps {
  course?: string | null;
  year?: string | number | null;
  className?: string;
}

export function CandidateAcademicStatusCard({
  course,
  year,
  className,
}: CandidateAcademicStatusCardProps) {
  const formattedYear = year
    ? /^\d+$/.test(String(year))
      ? `${year}º ano`
      : String(year)
    : "—";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        <span>Estado Académico</span>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-muted-foreground shrink-0">
            <Building2 className="size-4" />
            <span>Curso</span>
          </span>
          <span className="font-semibold uppercase text-foreground truncate max-w-[65%] text-right">
            {course || "—"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-muted-foreground shrink-0">
            <Calendar className="size-4" />
            <span>Ano</span>
          </span>
          <span className="font-medium text-foreground text-right">
            {formattedYear}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CandidateAcademicStatusCard;
