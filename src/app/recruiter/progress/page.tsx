import ProgressPhaseCardShowcase from "@/components/progress/progress-phase-card-showcase";
import { PageHeader } from "@/components/layout/page-header";
import { getSession } from "@/lib/auth";
import { getRecruitmentPhases } from "@/lib/recruitment";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";

const checkedVerifiers: {
  [key: string]: (
    userId: string | undefined,
    phaseId?: number,
  ) => Promise<boolean>;
} = {
  availability: async () => true,
};

export default async function RecruiterProgress() {
  const session = await getSession();

  const targetId = await getTargetRecruitmentId();

  const progressPhases = await Promise.all(
    (await getRecruitmentPhases("recruiter", targetId)).map(async (phase) => {
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
      <PageHeader title="Progresso" />
      <p className="text-center">
        Acompanha aqui as tarefas que tens de realizar durante o recrutamento.
      </p>

      <ProgressPhaseCardShowcase
        role="recruiter"
        progressPhases={progressPhases}
      />
    </div>
  );
}
