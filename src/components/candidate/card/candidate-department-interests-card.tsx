"use client";

import { Network } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CandidateDepartmentInterestsCardProps {
  interests?: string[] | null;
  className?: string;
}

export function CandidateDepartmentInterestsCard({
  interests,
  className,
}: CandidateDepartmentInterestsCardProps) {
  const departmentList = interests ?? [];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        <span>Departamentos de Interesse</span>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
        {departmentList.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {departmentList.map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className="rounded-md font-medium text-xs px-2.5 py-1 h-auto"
              >
                {interest}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Nenhum departamento indicado
          </p>
        )}
      </div>
    </div>
  );
}

export default CandidateDepartmentInterestsCard;
