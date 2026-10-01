import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CandidateListMetadata } from "@/lib/candidate";
import type { Dynamic, Interview, Slot } from "@/lib/db";
import { AlertCircle, CalendarCheck, CheckCircle2, Users } from "lucide-react";

interface BookingAdminStatsProps {
  bookings: {
    interview: Array<
      Interview & {
        slot: Slot;
        candidate?: any;
        recruiters?: any[];
      }
    >;
    dynamic: Array<
      Dynamic & {
        slot: Slot;
        candidates?: any[];
        recruiters?: any[];
      }
    >;
  };
  candidates: Array<CandidateListMetadata>;
  weekStart?: Date;
  weekEnd?: Date;
}

export function BookingAdminStats({
  bookings,
  candidates,
  weekStart,
  weekEnd,
}: BookingAdminStatsProps) {
  const interviews = bookings.interview ?? [];
  const dynamics = bookings.dynamic ?? [];

  const filterWeek = (items: Array<{ slot?: { start?: Date } }>) => {
    if (!weekStart || !weekEnd) return [];
    const s = new Date(weekStart);
    s.setHours(0, 0, 0, 0);
    const e = new Date(weekEnd);
    e.setHours(23, 59, 59, 999);
    return items.filter((item) => {
      if (!item.slot?.start) return false;
      const d = new Date(item.slot.start);
      return d >= s && d <= e;
    });
  };

  const weekInterviews = filterWeek(interviews);
  const weekDynamics = filterWeek(dynamics);

  const interviewsMissingRecruiters = interviews.filter(
    (i) => (i.recruiters?.length || 0) === 0,
  ).length;
  const dynamicsMissingRecruiters = dynamics.filter(
    (d) => (d.recruiters?.length || 0) === 0,
  ).length;
  const totalMissingRecruiters =
    interviewsMissingRecruiters + dynamicsMissingRecruiters;

  const unmarkedInterviews = candidates.filter((c) => !c.interview).length;

  const stats = [
    {
      label: "Entrevistas Agendadas",
      value: `${interviews.length}`,
      description: `${weekInterviews.length} nesta semana • ${candidates.length - unmarkedInterviews} candidatos`,
      icon: CalendarCheck,
    },
    {
      label: "Dinâmicas Agendadas",
      value: `${dynamics.length}`,
      description: `${weekDynamics.length} nesta semana`,
      icon: Users,
    },
    {
      label: "Sem Recrutadores",
      value: `${totalMissingRecruiters}`,
      description:
        totalMissingRecruiters > 0
          ? `${interviewsMissingRecruiters} entrevistas e ${dynamicsMissingRecruiters} dinâmicas sem recrutador`
          : "Todas as sessões têm recrutadores atribuídos",
      icon: totalMissingRecruiters > 0 ? AlertCircle : CheckCircle2,
      alert: totalMissingRecruiters > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <div
                  className={`rounded-lg p-2 ${
                    stat.alert
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
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
