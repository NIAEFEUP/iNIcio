"use client";

import { RecruitmentPhase } from "@/lib/db";
import ProgressPhaseCard from "./progress-phase-card";

const progressPhaseActions: { [key: string]: string } = {
  entrevista: "/candidate/interview/schedule",
  dinâmica: "/candidate/dynamic/schedule",
};

interface ProgressPhaseCardShowcaseProps {
  progressPhases: Array<RecruitmentPhase & { checked: boolean }>;
}

export default function ProgressPhaseCardShowcase({
  progressPhases,
}: ProgressPhaseCardShowcaseProps) {
  return (
    <>
      <div className="flex flex-col  justify-center mx-auto">
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
              />

              {idx !== progressPhases.length - 1 && (
                <div className="relative left-1/2 h-16 w-1 bg-gray-300" />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
