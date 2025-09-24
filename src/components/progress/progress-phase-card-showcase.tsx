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
  }

  return null;
};

export default function ProgressPhaseCardShowcase({
  progressPhases,
  candidate,
}: ProgressPhaseCardShowcaseProps) {
  return (
    <>
      <div className="flex flex-col gap-4 justify-center mx-128">
        {progressPhases.map((phase, idx) => {
          return (
            <div key={`${phase.title}-${idx}`}>
              <ProgressPhaseCard
                key={idx}
                number={idx + 1}
                title={phase.title}
                description={phase.description}
                width={128}
                redirectUrl={
                  progressPhaseActions[phase.title.trim().toLowerCase()]
                }
                checked={phase.checked}
                phaseStart={phase.start}
                phaseEnd={phase.end}
                eventDate={getEventDate(phase, candidate)}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
