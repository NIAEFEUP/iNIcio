import { Card, CardContent } from "@/components/ui/card";
import { CandidateWithMetadata } from "@/lib/candidate";
import { Calendar, Users, UserCheck, UserX } from "lucide-react";

interface StatsGridProps {
  slots: {
    [key: string]: Array<{ quantity: number }>;
  };
  slotType: string;
  candidates: Array<CandidateWithMetadata>;
}

export function SlotAdminStats({
  slots,
  slotType,
  candidates,
}: StatsGridProps) {
  const stats = [
    {
      label: "Total criados",
      value: slots[slotType].length,
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Slots disponíveis",
      value: slots[slotType].filter((c) => c.quantity > 0).length,
      icon: UserCheck,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Entrevista não marcada",
      value: candidates.filter((c) => !c.interview).length,
      icon: Users,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      label: "Dinâmica não marcada",
      value: candidates.filter((c) => !c.dynamic).length,
      icon: UserX,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/30",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <div className={`rounded-full p-3 ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
