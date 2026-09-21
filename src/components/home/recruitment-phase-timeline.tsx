import { getPhaseState, type PhaseState } from "@/lib/recruitment-state";
import type { RecruitmentPhase } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATE_CONFIG: Record<
  PhaseState,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  open: { label: "A decorrer", variant: "default" },
  upcoming: { label: "Futura", variant: "outline" },
  closed: { label: "Terminada", variant: "secondary" },
};

function formatWindow(phase: RecruitmentPhase): string {
  const start = phase.start
    ? new Date(phase.start).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "short",
      })
    : "—";
  const end = phase.end
    ? new Date(phase.end).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "short",
      })
    : "—";
  return `${start} a ${end}`;
}

interface RecruitmentPhaseTimelineProps {
  phases: RecruitmentPhase[];
}

export default function RecruitmentPhaseTimeline({
  phases,
}: RecruitmentPhaseTimelineProps) {
  const now = new Date();
  const sorted = [...phases].sort(
    (a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0),
  );

  if (sorted.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-lg text-left">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
        Fases do Recrutamento
      </h3>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {sorted.map((phase) => {
            const state = getPhaseState(phase, now);
            const { label, variant } = STATE_CONFIG[state];

            return (
              <div
                key={phase.id}
                className="flex items-center justify-between p-4 transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {phase.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatWindow(phase)}
                  </p>
                </div>
                <Badge variant={variant} className="text-xs font-normal">
                  {label}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
