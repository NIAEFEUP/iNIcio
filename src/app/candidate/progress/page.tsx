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
import { redirect } from "next/navigation";

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

  if (!session?.user) {
    redirect("/login");
  }

  const progressPhases = await Promise.all(
    (await getRecruitmentPhases("candidate")).map(async (phase) => {
      const kind = getRecruitmentPhaseKind(phase);

      const checked = kind
        ? ((await phaseCheckers[kind]?.(session.user.id, phase)) ?? false)
        : false;

      return {
        ...phase,
        checked,
      };
    }),
  );

  const candidateWithInterviewAndDynamic =
    await getCandidateWithInterviewAndDynamic(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          O teu Progresso
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto leading-relaxed">
          Acompanha aqui o estado de cada fase do teu recrutamento e realiza os
          teus agendamentos à medida que abrem.
        </p>
      </div>

      <ProgressPhaseCardShowcase
        role="candidate"
        progressPhases={progressPhases}
        candidate={candidateWithInterviewAndDynamic}
      />
    </div>
  );
}
