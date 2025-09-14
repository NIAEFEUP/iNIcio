"use client";

import { RecruitmentPhase } from "@/lib/db";
import ProgressPhaseCard from "./progress-phase-card";

import { redirect } from "next/navigation";

const progressPhaseActions: { [key: string]: () => void } = {
  entrevista: () => redirect("/candidate/interview/schedule"),
  dinâmica: () => redirect("/candidate/dynamic/schedule"),
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
        {progressPhases.map(async (phase, idx) => {
          console.log("PHASE: ", phase);
          return (
            <div key={`${phase.title}-${idx}`}>
              <ProgressPhaseCard
                key={idx}
                number={idx + 1}
                title={phase.title}
                description={phase.description}
                width={128}
                onClick={progressPhaseActions[phase.title.trim().toLowerCase()]}
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
