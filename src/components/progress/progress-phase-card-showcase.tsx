"use client";

import { RecruitmentPhase } from "@/lib/db";
import ProgressPhaseCard from "./progress-phase-card";

const progressPhaseActions: { [key: string]: string } = {
  entrevista: "/candidate/interview/schedule",
  dinâmica: "/candidate/dynamic/schedule",
};

interface ProgressPhaseCardShowcaseProps {
  progressPhases: Array<RecruitmentPhase & { checked: boolean }>;
  candidate: any;
}

const getEventDate = (phase: RecruitmentPhase, candidate: any) => {
  if (phase.title.trim().toLowerCase() === "entrevista") {
    return candidate?.interview?.slot?.start?.toLocaleString("pt-PT");
  } else if (phase.title.trim().toLowerCase() === "dinâmica") {
    return candidate?.dynamic?.dynamic?.slot?.start?.toLocaleString("pt-PT");
  }

  return null;
};

export default function ProgressPhaseCardShowcase({
  progressPhases,
  candidate,
}: ProgressPhaseCardShowcaseProps) {
  return (
    <>
      <div className="flex flex-col gap-4 justify-center items-center">
        {progressPhases.map((phase, idx) => {
          const date = getEventDate(phase, candidate);

          return (
            <div key={`${phase.title}-${idx}`} className="w-full max-w-[50em]">
              <ProgressPhaseCard
                key={idx}
                number={idx + 1}
                title={phase.title}
                description={phase.description}
                redirectUrl={
                  progressPhaseActions[phase.title.trim().toLowerCase()]
                }
                checked={phase.checked}
                phaseStart={phase.start}
                phaseEnd={phase.end}
                eventDateText={
                  date && `${phase.title} em ${getEventDate(phase, candidate)}`
                }
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
