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

  const completedCount = progressPhases.filter((p) => p.checked).length;
  const totalCount = progressPhases.length;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row items-stretch">
      {/* Left Column: Context & Overview */}
      <div className="w-full lg:w-5/12 xl:w-4/12 p-6 sm:p-8 lg:p-12 lg:border-r border-border bg-muted/15 flex flex-col justify-between space-y-8">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Recrutamento NIAEFEUP
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              O teu Progresso
            </h1>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Acompanha aqui o estado de cada fase do teu processo seletivo.
            Mantém atenção aos prazos e realiza os teus agendamentos diretamente
            nas etapas ao lado assim que estiverem disponíveis.
          </p>

          {/* Minimalist Progress Overview */}
          {totalCount > 0 && (
            <div className="p-4 sm:p-5 rounded-xl border border-border bg-card space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-foreground">
                  Evolução do Recrutamento
                </span>
                <span className="text-muted-foreground">
                  {completedCount} de {totalCount} concluídas
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                {percentage === 100
                  ? "Todas as etapas foram concluídas! Consulta os resultados na página respetiva."
                  : "Completa a etapa atual para avançares no processo."}
              </p>
            </div>
          )}
        </div>

        {/* Footer info & contacts */}
        <div className="pt-6 border-t border-border/60 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            Dúvidas ou imprevistos de agendamento?
          </p>
          <p>
            Contacta-nos via{" "}
            <a
              href="mailto:geral@ni.fe.up.pt"
              className="underline hover:text-foreground"
            >
              geral@ni.fe.up.pt
            </a>{" "}
            ou pelo Instagram{" "}
            <a
              href="https://instagram.com/niaefeup"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              @niaefeup
            </a>
            .
          </p>
        </div>
      </div>

      {/* Right Column: Step Cards */}
      <div className="w-full lg:w-7/12 xl:w-8/12 p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-2xl w-full mx-auto space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Etapas de Seleção
            </span>
          </div>
          <ProgressPhaseCardShowcase
            role="candidate"
            progressPhases={progressPhases}
            candidate={candidateWithInterviewAndDynamic}
          />
        </div>
      </div>
    </div>
  );
}
