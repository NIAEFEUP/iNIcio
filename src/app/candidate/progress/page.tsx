import ProgressPhaseCardShowcase from "@/components/progress/progress-phase-card-showcase";
import { hasApplication } from "@/lib/application";
import { auth } from "@/lib/auth";
import getCandidateWithInterviewAndDynamic from "@/lib/candidate";
import {
  getRecruitmentPhases,
  isRecruitmentPhaseDone,
} from "@/lib/recruitment";
import {
  getRecruitmentPhaseKind,
  type RecruitmentPhaseKind,
} from "@/lib/recruitment-state";
import { RecruitmentPhase } from "@/lib/db";
import { headers } from "next/headers";

const phaseCheckers: Partial<
  Record<
    RecruitmentPhaseKind,
    (userId: string | undefined, phase: RecruitmentPhase) => Promise<boolean>
  >
> = {
  application: (userId, phase) => hasApplication(userId, phase.recruitmentId),
  interview: (userId, phase) => isRecruitmentPhaseDone(userId, phase.id),
  dynamic: (userId, phase) => isRecruitmentPhaseDone(userId, phase.id),
};

export default async function CandidateProgress() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const progressPhases = await Promise.all(
    (await getRecruitmentPhases("candidate")).map(async (phase) => {
      const kind = getRecruitmentPhaseKind(phase);

      const checked = kind
        ? ((await phaseCheckers[kind]?.(session?.user.id, phase)) ?? false)
        : false;

      return {
        ...phase,
        checked,
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
