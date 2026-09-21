"use client";

import { RecruitmentPhase } from "@/lib/db";
import ProgressPhaseCard from "./progress-phase-card";

const progressPhaseActions: Record<string, string> = {
  candidatura: "/application",
  recruiter_availability: "/recruiter/availability",
  who_knows: "/candidates",
  resultado: "/#candidaturas",
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
  return (
    <div className="flex flex-col gap-4 w-full">
      {progressPhases.map((phase, idx) => {
        const date =
          role === "candidate" ? getCandidateEventDate(phase, candidate) : null;

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
  );
}
