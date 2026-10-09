"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { classificationBadgeClass } from "./classification-styles";

export function ClassificationSelect({
  value,
  onValueChange,
  triggerClassName,
}: {
  value?: string | null;
  onValueChange: (value: string) => void;
  triggerClassName?: string;
}) {
  const current = value && value !== "none" ? value : null;

  return (
    <Select value={current ?? ""} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "text-xs font-medium",
          classificationBadgeClass(current),
          triggerClassName,
        )}
      >
        <SelectValue placeholder="Classificar" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="muito fraco">Muito fraco</SelectItem>
        <SelectItem value="normal">Normal</SelectItem>
        <SelectItem value="muito forte">Muito forte</SelectItem>
        <SelectItem value="none">Limpar</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default ClassificationSelect;
