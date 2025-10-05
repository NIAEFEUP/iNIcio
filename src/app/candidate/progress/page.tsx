import ProgressPhaseCardShowcase from "@/components/progress/progress-phase-card-showcase";
import { hasApplication } from "@/lib/application";
import { auth } from "@/lib/auth";
import getCandidateWithInterviewAndDynamic from "@/lib/candidate";
import {
  getRecruitmentPhases,
  isRecruitmentPhaseDone,
} from "@/lib/recruitment";
import { headers } from "next/headers";

const checkedVerifiers: {
  [key: string]: (
    userId: string | undefined,
    phaseId?: number,
  ) => Promise<boolean>;
} = {
  candidatura: hasApplication,
  entrevista: isRecruitmentPhaseDone,
  dinâmica: isRecruitmentPhaseDone,
};

export default async function CandidateProgress() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const progressPhases = await Promise.all(
    (await getRecruitmentPhases("candidate")).map(async (phase) => {
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

  const candidateWithInterviewAndDynamic =
    await getCandidateWithInterviewAndDynamic(session?.user.id);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl text-center font-bold">Progresso</h1>
      <p className="text-center">
        Agora que completaste a tua candidatura, tens outras tarefas para
        realizar!
      </p>

      <ProgressPhaseCardShowcase
        role="candidate"
        progressPhases={progressPhases}
        candidate={candidateWithInterviewAndDynamic}
      />
    </div>
  );
}
