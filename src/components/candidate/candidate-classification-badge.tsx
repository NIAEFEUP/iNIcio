import type React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface ClassificationBadgeProps {
  label: string;
  level: string;
  className?: string;
}

const levelConfig: Record<
  string,
  {
    color: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  "muito fraco": {
    color:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
    icon: <TrendingDown className="h-3 w-3" />,
    label: "Muito fraco",
  },
  normal: {
    color:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
    icon: <Minus className="h-3 w-3" />,
    label: "Normal",
  },
  "muito forte": {
    color:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
    icon: <TrendingUp className="h-3 w-3" />,
    label: "Muito forte",
  },
};

export function ClassificationBadge({
  label,
  level,
  className,
}: ClassificationBadgeProps) {
  const config = levelConfig[level] ?? {
    color:
      "bg-primary text-primary-foreground border-primary-200 dark:bg-primary dark:text-primary-400 dark:border-primary-900",
    icon: <Minus className="h-3 w-3" />,
    label: "Não classificado",
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">
        {label}:
      </span>
      <Badge
        variant="outline"
        className={cn("flex items-center gap-1 font-medium", config.color)}
      >
        {config.icon}
        {config.label}
      </Badge>
    </div>
  );
}
