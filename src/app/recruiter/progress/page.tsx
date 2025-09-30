import ProgressPhaseCardShowcase from "@/components/progress/progress-phase-card-showcase";
import { auth } from "@/lib/auth";
import { getRecruitmentPhases } from "@/lib/recruitment";
import { headers } from "next/headers";

const checkedVerifiers: {
  [key: string]: (
    userId: string | undefined,
    phaseId?: number,
  ) => Promise<boolean>;
} = {
  availability: async () => true,
};

export default async function RecruiterProgress() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const progressPhases = await Promise.all(
    (await getRecruitmentPhases("recruiter")).map(async (phase) => {
      const isDone = checkedVerifiers[
        phase.clientIdentifier.trim().toLowerCase()
      ]
        ? await checkedVerifiers[phase.clientIdentifier.trim().toLowerCase()](
            session?.user.id,
            phase.id,
          )
        : false;

      return {
        ...phase,
        checked: isDone,
      };
    }),
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl text-center font-bold">Progresso</h1>
      <p className="text-center">
        Agora que complestaste a tua candidatura, tens outras tarefas para
        realizar!
      </p>

      <ProgressPhaseCardShowcase
        role="recruiter"
        progressPhases={progressPhases}
      />
    </div>
  );
}
