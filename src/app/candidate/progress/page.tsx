import ProgressPhaseCard from "@/components/progress/progress-phase-card";
import ProgressPhaseCardShowcase from "@/components/progress/progress-phase-card-showcase";
import { getRecruitmentPhases } from "@/lib/recruitment";
import { redirect } from "next/navigation";

export default async function CandidateProgress() {
  const progressPhases = await getRecruitmentPhases();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl text-center font-bold">Progresso</h1>

      <ProgressPhaseCardShowcase progressPhases={progressPhases} />
    </div>
  );
}
