"use client";

import { RecruitmentPhase } from "@/lib/db";
import ProgressPhaseCard from "./progress-phase-card";
import { Badge } from "@/components/ui/badge";

const progressPhaseActions: Record<string, string> = {
  entrevista: "/candidate/interview/schedule",
  dinâmica: "/candidate/dynamic/schedule",
  candidatura: "/application",
  recruiter_availability: "/recruiter/availability",
  profile: "/profile",
  who_knows: "/candidates",
  resultado: "/candidate/result",
};

interface CandidateEventInfo {
  interview?: {
    slot?: {
      start?: Date | string | null;
    } | null;
  } | null;
  dynamic?: {
    dynamic?: {
      slot?: {
        start?: Date | string | null;
      } | null;
    } | null;
  } | null;
}

interface ProgressPhaseCardShowcaseProps {
  progressPhases: Array<RecruitmentPhase & { checked: boolean }>;
  candidate?: CandidateEventInfo | null;
  role: "candidate" | "recruiter";
}

const getCandidateEventDate = (
  phase: RecruitmentPhase,
  candidate: CandidateEventInfo | null,
) => {
  const identifier = phase.clientIdentifier.trim().toLowerCase();
  if (identifier === "entrevista" && candidate?.interview?.slot?.start) {
    return new Date(candidate.interview.slot.start).toLocaleString("pt-PT", {
      dateStyle: "full",
      timeStyle: "short",
    });
  } else if (
    identifier === "dinâmica" &&
    candidate?.dynamic?.dynamic?.slot?.start
  ) {
    return new Date(candidate.dynamic.dynamic.slot.start).toLocaleString(
      "pt-PT",
      {
        dateStyle: "full",
        timeStyle: "short",
      },
    );
  }
  return null;
};

export default function ProgressPhaseCardShowcase({
  progressPhases,
  candidate = null,
  role,
}: ProgressPhaseCardShowcaseProps) {
  const completedCount = progressPhases.filter((p) => p.checked).length;
  const totalCount = progressPhases.length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Etapas do Processo
          </span>
          <Badge variant="outline" className="text-xs font-normal">
            {completedCount} de {totalCount} concluídas
          </Badge>
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {progressPhases.map((phase, idx) => {
          const date =
            role === "candidate"
              ? getCandidateEventDate(phase, candidate)
              : null;

          const actionUrl =
            progressPhaseActions[phase.clientIdentifier.trim().toLowerCase()];

          return (
            <ProgressPhaseCard
              key={phase.id || `${phase.title}-${idx}`}
              number={idx + 1}
              title={phase.title}
              description={phase.description}
              redirectUrl={actionUrl}
              checked={phase.checked}
              phaseStart={phase.start}
              phaseEnd={phase.end}
              eventDateText={date ? `Agendado para: ${date}` : null}
            />
          );
        })}
      </div>
    </div>
  );
}
