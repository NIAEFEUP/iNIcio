import { History } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface CandidatePreviousApplicationsBadgeProps {
  years: Array<string>;
  className?: string;
}

/** Flags a candidate who already applied in an earlier recruitment. */
export function CandidatePreviousApplicationsBadge({
  years,
  className,
}: CandidatePreviousApplicationsBadgeProps) {
  if (years.length === 0) return null;

  const shown = years.slice(0, 2).join(", ");
  const remaining = years.length - 2;

  return (
    <Badge
      variant="outline"
      className={className}
      title={`Candidaturas anteriores: ${years.join(", ")}`}
    >
      <History />
      Candidatou-se em {shown}
      {remaining > 0 ? ` +${remaining}` : ""}
    </Badge>
  );
}
