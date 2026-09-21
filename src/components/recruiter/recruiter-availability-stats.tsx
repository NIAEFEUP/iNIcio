import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, CalendarDays, Clock } from "lucide-react";

interface RecruiterAvailabilityStatsProps {
  availabilities: Array<{ start: Date; duration: number }>;
}

export function RecruiterAvailabilityStats({
  availabilities,
}: RecruiterAvailabilityStatsProps) {
  const totalMinutes = availabilities.reduce(
    (acc, availability) => acc + availability.duration,
    0,
  );

  const markedDays = new Set(
    availabilities.map((availability) => availability.start.toDateString()),
  ).size;

  const stats = [
    {
      label: "Disponibilidades marcadas",
      value: availabilities.length,
      icon: CalendarCheck,
    },
    {
      label: "Minutos disponíveis",
      value: totalMinutes,
      icon: Clock,
    },
    {
      label: "Dias marcados",
      value: markedDays,
      icon: CalendarDays,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <div className="rounded-full p-3 bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
