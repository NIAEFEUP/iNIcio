import type React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  classificationBadgeClass,
  classificationLabel,
} from "@/components/candidates/classification-styles";

interface ClassificationBadgeProps {
  label: string;
  level: string;
  className?: string;
}

const iconByLevel: Record<string, React.ReactNode> = {
  "muito fraco": <TrendingDown className="h-3 w-3" />,
  normal: <Minus className="h-3 w-3" />,
  "muito forte": <TrendingUp className="h-3 w-3" />,
};

export function ClassificationBadge({
  label,
  level,
  className,
}: ClassificationBadgeProps) {
  const displayLabel = classificationLabel(level);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">
        {label}:
      </span>
      {displayLabel ? (
        <Badge
          variant="outline"
          className={cn(
            "flex items-center gap-1 font-medium",
            classificationBadgeClass(level),
          )}
        >
          {iconByLevel[level]}
          {displayLabel}
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="flex items-center gap-1 font-medium"
        >
          <Minus className="h-3 w-3" />
          Não classificado
        </Badge>
      )}
    </div>
  );
}
