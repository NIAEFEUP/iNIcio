import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarCheck, CalendarDays, Clock } from "lucide-react";

interface RecruiterAvailabilityStatsProps {
  availabilities: Array<{ start: Date; duration: number }>;
  weekStart?: Date;
  weekEnd?: Date;
  slotMinutes?: number;
}

export function RecruiterAvailabilityStats({
  availabilities,
  weekStart,
  weekEnd,
  slotMinutes = 30,
}: RecruiterAvailabilityStatsProps) {
  const totalMinutes = availabilities.reduce(
    (acc, availability) => acc + availability.duration,
    0,
  );

  const totalHours = Math.floor(totalMinutes / 60);
  const totalRemM = totalMinutes % 60;
  const totalDurationStr =
    totalMinutes > 0
      ? `${totalHours}h${totalRemM > 0 ? ` ${totalRemM}m` : ""}`
      : "0h";

  const markedDays = new Set(
    availabilities.map((availability) =>
      new Date(availability.start).toDateString(),
    ),
  ).size;

  const weekSlots =
    weekStart && weekEnd
      ? availabilities.filter((a) => {
          const d = new Date(a.start);
          const startOfW = new Date(weekStart);
          startOfW.setHours(0, 0, 0, 0);
          const endOfW = new Date(weekEnd);
          endOfW.setHours(23, 59, 59, 999);
          return d >= startOfW && d <= endOfW;
        })
      : [];

  const weekMinutes = weekSlots.reduce((acc, a) => acc + a.duration, 0);
  const weekHours = Math.floor(weekMinutes / 60);
  const weekRemM = weekMinutes % 60;
  const weekDurationStr =
    weekMinutes > 0
      ? `${weekHours}h${weekRemM > 0 ? ` ${weekRemM}m` : ""}`
      : "0h";

  const weekDays = new Set(
    weekSlots.map((a) => new Date(a.start).toDateString()),
  ).size;

  const stats = [
    {
      label: "Disponibilidade Total",
      value: totalDurationStr,
      description: `${availabilities.length} slots de ${slotMinutes}m no recrutamento`,
      icon: Clock,
    },
    {
      label: "Dias com Horário",
      value: `${markedDays} ${markedDays === 1 ? "dia" : "dias"}`,
      description: "Dias com pelo menos um horário disponível",
      icon: CalendarDays,
    },
    {
      label: "Semana em Visualização",
      value: weekDurationStr,
      description:
        weekSlots.length > 0
          ? `${weekSlots.length} slots em ${weekDays} ${weekDays === 1 ? "dia" : "dias"}`
          : "Sem disponibilidade nesta semana",
      icon: CalendarCheck,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription className="text-xs uppercase tracking-wider font-medium">
                {stat.label}
              </CardDescription>
              <CardTitle className="text-2xl font-bold">{stat.value}</CardTitle>
              <CardAction>
                <div className="rounded-lg p-2 bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              {stat.description}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
