"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDateStringPT, getTimeString } from "@/lib/date";
import {
  bookOrChangeInterviewSlot,
  bookOrChangeDynamicSlot,
} from "@/lib/candidate-schedule-actions";

export interface CandidateSlotOption {
  id: number;
  start: string;
  duration: number;
  quantity: number;
}

export interface CandidateScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "interview" | "dynamic";
  title?: string;
  description?: string;
  slots: CandidateSlotOption[];
  currentSlot: { id: number; start: string; duration: number } | null;
  isPhaseOpen: boolean;
}

export function CandidateScheduleModal({
  open,
  onOpenChange,
  type,
  title,
  description,
  slots,
  currentSlot,
  isPhaseOpen,
}: CandidateScheduleModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  const isInterview = type === "interview";
  const modalTitle =
    title ??
    (isInterview ? "Agendamento de Entrevista" : "Inscrição na Dinâmica");
  const modalDescription =
    description ??
    (isInterview
      ? "Seleciona um dos horários disponíveis para a tua entrevista individual."
      : "Escolhe uma sessão para participares na dinâmica de grupo com a equipa.");

  const groupedSlots = useMemo(() => {
    const map = new Map<string, CandidateSlotOption[]>();
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

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedSlotId(null);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = () => {
    if (!selectedSlotId || !isPhaseOpen) return;

    startTransition(async () => {
      try {
        if (isInterview) {
          await bookOrChangeInterviewSlot(selectedSlotId);
        } else {
          await bookOrChangeDynamicSlot(selectedSlotId);
        }

        toast.success(
          currentSlot
            ? "Horário alterado com sucesso!"
            : "Horário agendado com sucesso!",
        );
        router.refresh();
        handleOpenChange(false);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao agendar o horário.";
        toast.error(message);
      }
    });
  };

  const isChanging = Boolean(currentSlot);
  const isSelectedDifferent =
    selectedSlotId !== null && selectedSlotId !== currentSlot?.id;
  const canSubmit = isPhaseOpen && isSelectedDifferent && !isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto sm:max-w-2xl p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
            {modalTitle}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {modalDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {currentSlot && (
            <div className="rounded-lg border border-border/70 bg-muted/40 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span>
                  {isInterview
                    ? "Horário Atual Marcado"
                    : "Sessão Atual Marcada"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {getDateStringPT(new Date(currentSlot.start))} às{" "}
                {getTimeString(new Date(currentSlot.start))}
                {currentSlot.duration ? ` (${currentSlot.duration} min)` : ""}
              </p>
              {isPhaseOpen ? (
                <p className="text-[11px] text-muted-foreground/80">
                  Para alterar, escolhe um novo horário disponível abaixo e
                  confirma a seleção.
                </p>
              ) : (
                <p className="text-[11px] text-destructive">
                  O período de agendamento desta fase já terminou. Não é
                  possível alterar o horário.
                </p>
              )}
            </div>
          )}

          {!isPhaseOpen && !currentSlot && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-xs text-destructive space-y-1">
                <p className="font-semibold">
                  Período de agendamento indisponível
                </p>
                <p className="text-destructive/80">
                  O período de agendamento para esta etapa não se encontra ativo
                  de momento.
                </p>
              </div>
            </div>
          )}

          {isPhaseOpen && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">
                  Horários Disponíveis
                </span>
                <span>
                  {slots.length} {slots.length === 1 ? "opção" : "opções"}
                </span>
              </div>

              {groupedSlots.length === 0 ? (
                <div className="text-center py-8 rounded-lg border border-dashed border-border/80 p-6 space-y-2">
                  <Clock className="size-8 mx-auto text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">
                    Sem outros horários disponíveis
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    De momento não existem vagas disponíveis para agendamento.
                    Contacta a equipa caso precises de reagendar.
                  </p>
                </div>
              ) : (
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
                          const isCurrent = currentSlot?.id === slotItem.id;
                          const isSelected = selectedSlotId === slotItem.id;

                          return (
                            <button
                              key={slotItem.id}
                              type="button"
                              onClick={() => {
                                if (isCurrent) return;
                                setSelectedSlotId(slotItem.id);
                              }}
                              disabled={isCurrent || isPending}
                              className={cn(
                                "flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-all cursor-pointer select-none",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground shadow-xs font-medium"
                                  : isCurrent
                                    ? "border-emerald-500/40 bg-emerald-500/10 text-foreground cursor-default"
                                    : "border-border/70 bg-card hover:bg-accent/50 text-foreground",
                                isPending && "opacity-50 pointer-events-none",
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
                                  : `${slotItem.duration} min`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 mt-2 border-t border-border/50 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="w-full sm:w-auto text-xs"
          >
            Fechar
          </Button>

          {isPhaseOpen && (
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={!canSubmit}
              className="w-full sm:w-auto text-xs font-medium cursor-pointer"
            >
              {isPending && (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              )}
              {isChanging
                ? selectedSlotId
                  ? "Confirmar Alteração"
                  : "Seleciona um novo horário"
                : "Confirmar Agendamento"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
