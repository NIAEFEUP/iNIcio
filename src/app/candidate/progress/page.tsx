import ProgressPhaseCard from "@/components/progress/progress-phase-card";
import ProgressPhaseCardShowcase from "@/components/progress/progress-phase-card-showcase";
import { redirect } from "next/navigation";

export default async function CandidateProgress() {
  const progressPhases = [
    {
      id: 1,
      recruitmentYear: 2024,
      role: "candidate",
      start: "",
      end: "",
      title: "Entrevista",
      description: "Marca a tua entrevista",
    },
    {
      id: 2,
      recruitmentYear: 2024,
      role: "candidate",
      start: "",
      end: "",
      title: "Dinâmica",
      description: "Marca a tua dinâmica",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl text-center font-bold">Progresso</h1>

      <ProgressPhaseCardShowcase progressPhases={progressPhases} />
    </div>
  );
}
