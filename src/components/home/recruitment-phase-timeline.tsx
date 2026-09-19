import { getPhaseState, type PhaseState } from "@/lib/recruitment-state";
import type { RecruitmentPhase } from "@/lib/db";

const STATE_LABELS: Record<PhaseState, string> = {
  upcoming: "Futura",
  open: "A decorrer",
  closed: "Terminada",
};

const STATE_BADGE_CLASSES: Record<PhaseState, string> = {
  open: "bg-primary text-primary-foreground",
  upcoming: "bg-secondary text-secondary-foreground",
  closed: "bg-secondary text-secondary-foreground",
};

function formatWindow(phase: RecruitmentPhase): string {
  const start = phase.start
    ? new Date(phase.start).toLocaleString("pt-PT")
    : "—";
  const end = phase.end ? new Date(phase.end).toLocaleString("pt-PT") : "—";
  return `${start} – ${end}`;
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

  return (
    <ul className="mx-auto mt-10 flex w-full max-w-lg list-none flex-col gap-3 text-left">
      {sorted.map((phase) => {
        const state = getPhaseState(phase, now);

        return (
          <li
            key={phase.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-card-foreground">
                {phase.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatWindow(phase)}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs ${STATE_BADGE_CLASSES[state]}`}
            >
              {STATE_LABELS[state]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
