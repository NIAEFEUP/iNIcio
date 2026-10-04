import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  CandidateListMetadata,
  CandidateSchedulingStats,
} from "@/lib/candidate";
import { Calendar, Users, UserCheck, UserX } from "lucide-react";
import type { SlotType } from "./slot-admin-calendar";

interface StatsGridProps {
  slots: {
    interview?: Array<{ start: Date; duration: number; quantity: number }>;
    dynamic?: Array<{ start: Date; duration: number; quantity: number }>;
    [key: string]:
      Array<{ start?: Date; duration?: number; quantity?: number }> | undefined;
  };
  slotType?: SlotType | string;
  candidates?: Array<CandidateListMetadata>;
  candidateStats?: CandidateSchedulingStats;
  weekStart?: Date;
  weekEnd?: Date;
}

export function SlotAdminStats({
  slots,
  candidates,
  candidateStats,
  weekStart,
  weekEnd,
}: StatsGridProps) {
  const interviewSlots = slots.interview ?? [];
  const dynamicSlots = slots.dynamic ?? [];

  const filterWeek = (
    items: Array<{ start?: Date; duration?: number; quantity?: number }>,
  ) => {
    if (!weekStart || !weekEnd) return [];
    const s = new Date(weekStart);
    s.setHours(0, 0, 0, 0);
    const e = new Date(weekEnd);
    e.setHours(23, 59, 59, 999);
    return items.filter((item) => {
      if (!item.start) return false;
      const d = new Date(item.start);
      return d >= s && d <= e;
    });
  };

  const weekInterviewSlots = filterWeek(interviewSlots);
  const weekDynamicSlots = filterWeek(dynamicSlots);

  const interviewVacancies = interviewSlots.reduce(
    (acc, s) => acc + (s.quantity || 1),
    0,
  );
  const dynamicVacancies = dynamicSlots.reduce(
    (acc, s) => acc + (s.quantity || 1),
    0,
  );

  const totalCandidates = candidateStats?.total ?? candidates?.length ?? 0;
  const unmarkedInterviews =
    candidateStats?.unmarkedInterviews ??
    (candidates ? candidates.filter((c) => !c.interview).length : 0);
  const unmarkedDynamics =
    candidateStats?.unmarkedDynamics ??
    (candidates ? candidates.filter((c) => !c.dynamic).length : 0);

  const stats = [
    {
      label: "Slots de Entrevista",
      value: `${interviewSlots.length}`,
      description: `${interviewVacancies} vagas • ${weekInterviewSlots.length} nesta semana`,
      icon: Calendar,
    },
    {
      label: "Slots de Dinâmica",
      value: `${dynamicSlots.length}`,
      description: `${dynamicVacancies} vagas • ${weekDynamicSlots.length} nesta semana`,
      icon: Users,
    },
    {
      label: "Entrevistas por Marcar",
      value: `${unmarkedInterviews}`,
      description: `${totalCandidates - unmarkedInterviews} de ${totalCandidates} já agendadas`,
      icon: UserCheck,
    },
    {
      label: "Dinâmicas por Marcar",
      value: `${unmarkedDynamics}`,
      description: `${totalCandidates - unmarkedDynamics} de ${totalCandidates} já agendadas`,
      icon: UserX,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
