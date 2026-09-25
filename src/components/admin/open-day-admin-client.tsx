"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  ImageIcon,
  MapPin,
  ToggleLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toast";
import type { Recruitment } from "@/lib/db";

interface OpenDayAdminClientProps {
  recruitment: Recruitment;
  onSave: (input: {
    openDayEnabled: boolean;
    openDayDate: string | null;
    openDayStartTime: string;
    openDayEndTime: string;
    openDayRoom: string;
    openDayImage: string;
  }) => Promise<void>;
}

export default function OpenDayAdminClient({
  recruitment,
  onSave,
}: OpenDayAdminClientProps) {
  const [enabled, setEnabled] = useState(recruitment.openDayEnabled);
  const [date, setDate] = useState(
    recruitment.openDayDate
      ? new Date(recruitment.openDayDate).toISOString().slice(0, 10)
      : "",
  );
  const [startTime, setStartTime] = useState(
    recruitment.openDayStartTime || "10:00",
  );
  const [endTime, setEndTime] = useState(recruitment.openDayEndTime || "18:00");
  const [room, setRoom] = useState(recruitment.openDayRoom || "B315");
  const [image, setImage] = useState(
    recruitment.openDayImage || "/images/B315.jpeg",
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (enabled && !date) {
      toast.add({
        title: "Data obrigatória",
        description:
          "Indica a data do NI Open Day antes de ativar a publicação.",
      });
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        openDayEnabled: enabled,
        openDayDate: enabled && date ? date : null,
        openDayStartTime: startTime,
        openDayEndTime: endTime,
        openDayRoom: room.trim() || "B315",
        openDayImage: image.trim() || "/images/B315.jpeg",
      });

      toast.add({
        title: "NI Open Day atualizado",
        description: enabled
          ? "O anúncio já está ativo na landing page."
          : "O anúncio foi desativado e não aparece na landing page.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao guardar o NI Open Day.";

      toast.add({
        title: "Erro ao guardar",
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="NI Open Day" />

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <CalendarDays className="size-5 text-primary" />
            Gestão do evento
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Controla se o anúncio aparece na landing page, a data, o horário e a
            sala.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Mostrar anúncio
                </p>
                <p className="text-sm text-muted-foreground">
                  Quando está desligado, o evento não aparece na landing page.
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                aria-label="Ativar NI Open Day"
              />
            </div>

            {enabled && (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="open-day-date" className="text-foreground">
                    Dia
                  </Label>
                  <Input
                    id="open-day-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="bg-input border-border text-foreground"
                    required={enabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="open-day-room" className="text-foreground">
                    Sala
                  </Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="open-day-room"
                      value={room}
                      onChange={(event) => setRoom(event.target.value)}
                      placeholder="B315"
                      className="bg-input border-border pl-9 text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="open-day-start" className="text-foreground">
                    Hora de abertura
                  </Label>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="open-day-start"
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="bg-input border-border pl-9 text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="open-day-end" className="text-foreground">
                    Hora de fecho
                  </Label>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="open-day-end"
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="bg-input border-border pl-9 text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="open-day-image" className="text-foreground">
                    URL da imagem
                  </Label>
                  <div className="relative">
                    <ImageIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="open-day-image"
                      value={image}
                      onChange={(event) => setImage(event.target.value)}
                      placeholder="/images/B315.jpeg"
                      className="bg-input border-border pl-9 text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" asChild>
                <a href="/admin">Cancelar</a>
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "A guardar..." : "Guardar alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
