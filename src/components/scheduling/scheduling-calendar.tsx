"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";

import { Slot } from "@/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDateStringPT, getTimeString } from "@/lib/date";

interface SchedulingCalendarProps {
  slots: Array<Slot>;
  multipleSlots?: boolean;
  confirmAction: (slot: Array<Slot>) => Promise<boolean>;
  confirmUrl: string;
  chosenSlot?: Slot | null;
}

export default function SchedulingCalendar({
  slots,
  multipleSlots = false,
  confirmAction,
  confirmUrl,
  chosenSlot = null,
}: SchedulingCalendarProps) {
  const router = useRouter();

  const [selectedSlots, setSelectedSlots] = useState<Array<Slot>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group slots by date key YYYY-MM-DD
  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const dateKey = slot.start.toISOString().split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(slotsByDate).sort();

  // Sort slots within each date
  for (const dateKey of sortedDates) {
    slotsByDate[dateKey].sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  const handleSlotSelect = (slot: Slot) => {
    if (multipleSlots) {
      if (selectedSlots.some((s) => s.id === slot.id)) {
        setSelectedSlots(selectedSlots.filter((s) => s.id !== slot.id));
      } else {
        setSelectedSlots([...selectedSlots, slot]);
      }
    } else {
      setSelectedSlots([slot]);
    }
  };

  const isSlotSelected = (slot: Slot) => {
    return selectedSlots.some((s) => s.id === slot.id);
  };

  const handleConfirm = async () => {
    if (selectedSlots.length === 0) return;
    setIsSubmitting(true);

    try {
      const ok = await confirmAction(selectedSlots);
      if (ok) {
        toast.success("Horário agendado com sucesso!");
        router.push(confirmUrl);
        router.refresh();
      } else {
        toast.error("Ocorreu um erro ao tentar agendar o horário.");
      }
    } catch {
      toast.error("Erro ao comunicar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current booking card if candidate already booked */}
      {chosenSlot && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              <CardTitle className="text-base">Horário Atual Marcado</CardTitle>
            </div>
            <CardDescription>
              Já tens um horário reservado. Se desejares alterar, escolhe um
              novo horário abaixo e confirma a seleção.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs">
                <Calendar className="size-3.5" />
                {getDateStringPT(chosenSlot.start)}
              </Badge>
              <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs">
                <Clock className="size-3.5" />
                {getTimeString(chosenSlot.start)}
                {chosenSlot.duration ? ` (${chosenSlot.duration} min)` : ""}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected slot pending confirmation */}
      {selectedSlots.length > 0 && (
        <Card className="border-primary/50 bg-primary/5 shadow-sm">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Horário Selecionado
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {selectedSlots.map((s) => (
                  <Badge key={s.id} variant="default" className="text-xs">
                    {getDateStringPT(s.start)} às {getTimeString(s.start)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSlots([])}
                disabled={isSubmitting}
              >
                Limpar
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? "A confirmar..." : "Confirmar Agendamento"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available slots list grouped by day */}
      {sortedDates.length === 0 ? (
        <Card className="text-center p-8">
          <CardHeader>
            <div className="mx-auto size-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <AlertCircle className="size-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-base">
              Sem horários disponíveis
            </CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Não existem horários vagos de momento. Por favor aguarda que a
              equipa disponibilize novas vagas ou entra em contacto se tiveres
              dúvidas.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Dias & Vagas Disponíveis
            </h2>
            <span className="text-xs text-muted-foreground">
              {slots.length} {slots.length === 1 ? "vaga" : "vagas"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedDates.map((dateKey) => {
              const daySlots = slotsByDate[dateKey];
              const firstSlotDate = daySlots[0].start;
              const dayName = firstSlotDate.toLocaleDateString("pt-PT", {
                weekday: "long",
              });
              const formattedDate = firstSlotDate.toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "long",
              });

              return (
                <Card key={dateKey} className="overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <CardTitle className="text-sm font-semibold capitalize text-foreground">
                          {dayName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formattedDate}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs font-normal">
                        {daySlots.length}{" "}
                        {daySlots.length === 1 ? "horário" : "horários"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 sm:p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {daySlots.map((slot) => {
                        const selected = isSlotSelected(slot);
                        const isChosen = chosenSlot?.id === slot.id;

                        return (
                          <Button
                            key={slot.id}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSlotSelect(slot)}
                            className={`flex flex-col items-center justify-center h-auto py-2.5 px-2 ${
                              isChosen && !selected
                                ? "border-primary/50 text-primary"
                                : ""
                            }`}
                          >
                            <span className="text-xs font-medium">
                              {getTimeString(slot.start)}
                            </span>
                            <span className="text-[10px] opacity-75">
                              {slot.duration ? `${slot.duration} min` : ""}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
