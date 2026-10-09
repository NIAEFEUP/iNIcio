import { cn } from "@/lib/utils";
import {
  classificationLabel,
  classificationTextClass,
} from "./classification-styles";

export function DecisionText({
  decision,
  className,
}: {
  decision: "approve" | "reject" | null | undefined;
  className?: string;
}) {
  const approve = decision === "approve";
  const reject = decision === "reject";
  return (
    <span
      className={cn(
        "font-medium",
        approve
          ? "text-emerald-600/80 dark:text-emerald-400/80"
          : reject
            ? "text-rose-600/80 dark:text-rose-400/80"
            : "text-muted-foreground",
        className,
      )}
    >
      {approve ? "Aprovado" : reject ? "Rejeitado" : "Pendente"}
    </span>
  );
}

export function ClassificationText({
  level,
  className,
}: {
  level: string | null | undefined;
  className?: string;
}) {
  return (
    <span
      className={cn("font-medium", classificationTextClass(level), className)}
    >
      {classificationLabel(level) ?? "—"}
    </span>
  );
}
