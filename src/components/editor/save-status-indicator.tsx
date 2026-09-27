import { Check, Loader2, AlertCircle } from "lucide-react";
import type { SaveStatus } from "./real-time-editor";
import { cn } from "@/lib/utils";

interface SaveStatusIndicatorProps {
  status?: SaveStatus | null;
  className?: string;
}

export function SaveStatusIndicator({
  status,
  className,
}: SaveStatusIndicatorProps) {
  if (!status) return null;

  switch (status) {
    case "saving":
      return (
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs text-muted-foreground",
            className,
          )}
        >
          <Loader2 className="size-3.5 animate-spin" />
          <span>A guardar...</span>
        </span>
      );
    case "saved":
      return (
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs text-muted-foreground",
            className,
          )}
        >
          <Check className="size-3.5 text-emerald-500" />
          <span>Guardado</span>
        </span>
      );
    case "unsaved":
      return (
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs text-amber-500 dark:text-amber-400",
            className,
          )}
        >
          <span className="size-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
          <span>Alterações pendentes</span>
        </span>
      );
    case "error":
      return (
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs text-destructive",
            className,
          )}
        >
          <AlertCircle className="size-3.5" />
          <span>Erro ao guardar</span>
        </span>
      );
  }
}
