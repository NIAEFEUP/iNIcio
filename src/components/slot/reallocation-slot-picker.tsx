"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { getTimeString } from "@/lib/date";
import { Slot } from "@/lib/db";

export interface ReallocationSlotPickerProps {
  type: "interview" | "dynamic";
  slots: Slot[];
  currentSlotId?: number;
  selectedSlotId?: number | null;
  pending?: boolean;
  onSelect: (slotId: number | null) => void;
}

export default function ReallocationSlotPicker({
  type,
  slots,
  currentSlotId,
  selectedSlotId,
  pending,
  onSelect,
}: ReallocationSlotPickerProps) {
  const groupedSlots = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const dateKey = new Date(slot.start).toISOString().split("T")[0];
      const list = map.get(dateKey) ?? [];
      list.push(slot);
      map.set(dateKey, list);
    }

    const sortedEntries = Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    return sortedEntries.map(([dateKey, daySlots]) => {
      const sortedDaySlots = [...daySlots].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      );
      const firstDate = new Date(sortedDaySlots[0].start);
      return {
        dateKey,
        dayName: firstDate.toLocaleDateString("pt-PT", { weekday: "long" }),
        formattedDate: firstDate.toLocaleDateString("pt-PT", {
          day: "numeric",
          month: "long",
        }),
        slots: sortedDaySlots,
      };
    });
  }, [slots]);

  const isInterview = type === "interview";

  if (groupedSlots.length === 0) {
    return (
      <div className="text-center py-8 rounded-lg border border-dashed border-border/80 p-6 space-y-2">
        <Clock className="size-8 mx-auto text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">
          Sem outros horários disponíveis
        </p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          De momento não existem vagas disponíveis para realocação.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedSlots.map((group) => (
        <div
          key={group.dateKey}
          className="rounded-lg border border-border/60 overflow-hidden bg-card"
        >
          <div className="bg-muted/30 px-3.5 py-2 border-b border-border/60 flex items-center justify-between">
            <span className="text-xs font-semibold capitalize text-foreground">
              {group.dayName}
            </span>
            <span className="text-xs text-muted-foreground">
              {group.formattedDate}
            </span>
          </div>

          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {group.slots.map((slotItem) => {
              const slotDate = new Date(slotItem.start);
              const isCurrent = currentSlotId === slotItem.id;
              const isSelected = selectedSlotId === slotItem.id;

              return (
                <button
                  key={slotItem.id}
                  type="button"
                  onClick={() => {
                    if (isCurrent) return;
                    onSelect(isSelected ? null : slotItem.id);
                  }}
                  disabled={isCurrent || pending}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-all cursor-pointer select-none",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-xs font-medium"
                      : isCurrent
                        ? "border-emerald-500/40 bg-emerald-500/10 text-foreground cursor-default"
                        : isInterview
                          ? "border-border/70 bg-card hover:bg-accent/50 text-foreground"
                          : "border-border/70 bg-card hover:bg-accent/50 text-foreground",
                    pending && "opacity-50 pointer-events-none",
                  )}
                >
                  <div className="flex items-center gap-1 font-semibold text-sm">
                    <span>{getTimeString(slotDate)}</span>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] mt-0.5",
                      isSelected
                        ? "text-primary-foreground/90"
                        : "text-muted-foreground",
                    )}
                  >
                    {isCurrent
                      ? "Atual"
                      : `${slotItem.duration} min · ${slotItem.quantity} ${
                          slotItem.quantity === 1 ? "vaga" : "vagas"
                        }`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
