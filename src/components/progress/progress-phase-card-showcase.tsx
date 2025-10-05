"use client";

import { RecruitmentPhase } from "@/lib/db";
import ProgressPhaseCard from "./progress-phase-card";

const progressPhaseActions: { [key: string]: string } = {
  entrevista: "/candidate/interview/schedule",
  dinâmica: "/candidate/dynamic/schedule",
  candidatura: "/application",
  recruiter_availability: "/recruiter/availability",
  profile: "/profile",
  who_knows: "/candidates",
};

interface ProgressPhaseCardShowcaseProps {
  progressPhases: Array<RecruitmentPhase & { checked: boolean }>;
  candidate?: any | null;
  role: "candidate" | "recruiter";
}

const getCandidateEventDate = (phase: RecruitmentPhase, candidate: any) => {
  if (phase.clientIdentifier.trim().toLowerCase() === "entrevista") {
    return candidate?.interview?.slot?.start?.toLocaleString("pt-PT");
  } else if (phase.clientIdentifier.trim().toLowerCase() === "dinâmica") {
    return candidate?.dynamic?.dynamic?.slot?.start?.toLocaleString("pt-PT");
  }

  return null;
};

export default function ProgressPhaseCardShowcase({
  progressPhases,
  candidate = null,
  role,
}: ProgressPhaseCardShowcaseProps) {
  const getEventDate = (phase: RecruitmentPhase) => {
    if (role === "candidate") return getCandidateEventDate(phase, candidate);
    else if (role === "recruiter") return "";
  };

  return (
    <>
      <div className="flex flex-col gap-4 justify-center items-center">
        {progressPhases.map((phase, idx) => {
          const date = getEventDate(phase);

          return (
            <div key={`${phase.title}-${idx}`} className="w-full max-w-[50em]">
              <ProgressPhaseCard
                key={idx}
                number={idx + 1}
                title={phase.title}
                description={phase.description}
                redirectUrl={
                  progressPhaseActions[
                    phase.clientIdentifier.trim().toLowerCase()
                  ]
                }
                checked={phase.checked}
                phaseStart={phase.start}
                phaseEnd={phase.end}
                eventDateText={date && `Marcado em ${date}`}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
