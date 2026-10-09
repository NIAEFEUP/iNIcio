"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import {
  getOpenDayAnnouncementAction,
  saveOpenDayAnnouncementAction,
} from "@/lib/open-day-actions";

interface OpenDayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recruitmentId: number;
}

export function OpenDayModal({
  open,
  onOpenChange,
  recruitmentId,
}: OpenDayModalProps) {
  const [enabled, setEnabled] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [room, setRoom] = useState("B315");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !recruitmentId) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setIsLoading(true);
      }
    });

    getOpenDayAnnouncementAction(recruitmentId)
      .then((data) => {
        if (!cancelled) {
          setEnabled(data.enabled);
          setDate(data.date);
          setStartTime(data.startTime);
          setEndTime(data.endTime);
          setRoom(data.room);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          toast.add({
            title: "Erro ao carregar anúncio",
            description: "Não foi possível carregar os dados do Open Day.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, recruitmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (enabled && !date) {
      toast.add({
        title:
          "A data do NI Open Day é obrigatória quando o anúncio está ativo",
      });
      return;
    }

    try {
      setIsSaving(true);
      await saveOpenDayAnnouncementAction(recruitmentId, {
        enabled,
        date: date || null,
        startTime,
        endTime,
        room,
      });

      toast.add({
        title: "Open Day guardado",
        description:
          "As configurações do Open Day foram atualizadas com sucesso.",
      });

      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.add({
        title: "Erro ao guardar anúncio",
        description: "Ocorreu um erro ao atualizar os dados do Open Day.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Open Day</DialogTitle>
          <DialogDescription>
            Configura as informações e visibilidade do Open Day para este
            recrutamento.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/20 p-4">
              <div className="space-y-0.5">
                <Label
                  htmlFor="open-day-enabled"
                  className="text-sm font-medium"
                >
                  Anúncio Ativo
                </Label>
                <p className="text-xs text-muted-foreground">
                  Apresentar banner do Open Day na página inicial do iNIcio.
                </p>
              </div>
              <Switch
                id="open-day-enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="open-day-date" className="sm:text-right">
                  Data
                </Label>
                <Input
                  id="open-day-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="sm:col-span-3"
                  required={enabled}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="open-day-start-time" className="sm:text-right">
                  Hora de Início
                </Label>
                <Input
                  id="open-day-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="sm:col-span-3"
                  required={enabled}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="open-day-end-time" className="sm:text-right">
                  Hora de Fim
                </Label>
                <Input
                  id="open-day-end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="sm:col-span-3"
                  required={enabled}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="open-day-room" className="sm:text-right">
                  Sala
                </Label>
                <Input
                  id="open-day-room"
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="B315"
                  className="sm:col-span-3"
                  required={enabled}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "A guardar..." : "Guardar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
