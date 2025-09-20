import ProgressPhaseCardShowcase from "@/components/progress/progress-phase-card-showcase";
import { auth } from "@/lib/auth";
import {
  getRecruitmentPhases,
  isRecruitmentPhaseDone,
} from "@/lib/recruitment";
import { headers } from "next/headers";

const checkedVerifiers: {
  [key: string]: (
    userId: string | undefined,
    phaseId: number,
  ) => Promise<boolean>;
} = {
  entrevista: isRecruitmentPhaseDone,
  dinâmica: isRecruitmentPhaseDone,
};

export default async function CandidateProgress() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const progressPhases = await Promise.all(
    (await getRecruitmentPhases()).map(async (phase) => {
      const isDone = await checkedVerifiers[phase.title.trim().toLowerCase()](
        session?.user.id,
        phase.id,
      );
      return {
        ...phase,
        checked: isDone,
      };
    }),
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl text-center font-bold">Progresso</h1>

      <ProgressPhaseCardShowcase progressPhases={progressPhases} />
    </div>
  );
}
