import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";

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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const progressPhaseActions: Record<string, string> = {
  entrevista: "/candidate/interview/schedule",
  dinâmica: "/candidate/dynamic/schedule",
  candidatura: "/application",
  resultado: "/candidate/result",
};

export default async function CandidateProgress() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const rawPhases = await getRecruitmentPhases("candidate");

  const progressPhases = await Promise.all(
    rawPhases.map(async (phase) => {
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

  const candidateInfo = await getCandidateWithInterviewAndDynamic(
    session.user.id,
  );

  const interviewDate = candidateInfo?.interview?.slot?.start
    ? new Date(candidateInfo.interview.slot.start).toLocaleString("pt-PT", {
        dateStyle: "full",
        timeStyle: "short",
      })
    : null;

  const dynamicDate = candidateInfo?.dynamic?.dynamic?.slot?.start
    ? new Date(candidateInfo.dynamic.dynamic.slot.start).toLocaleString(
        "pt-PT",
        {
          dateStyle: "full",
          timeStyle: "short",
        },
      )
    : null;

  const now = new Date();

  // Find active actionable phase or next pending step
  const activePhase = progressPhases.find((phase) => {
    const isStarted = phase.start ? new Date(phase.start) <= now : false;
    const isNotEnded = phase.end ? new Date(phase.end) >= now : true;
    return isStarted && isNotEnded && !phase.checked;
  });

  const completedCount = progressPhases.filter((p) => p.checked).length;
  const totalCount = progressPhases.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-16 sm:py-24 text-center max-w-2xl mx-auto space-y-12">
      {/* Centered Big Heading & Primary Status */}
      <div className="space-y-4">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
          Recrutamento NIAEFEUP
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
          O teu Progresso.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {allCompleted
            ? "Completaste todas as etapas do processo de seleção! Os resultados serão publicados em breve."
            : activePhase
              ? `Fase atual: ${activePhase.title}. Consulta o teu estado e os próximos passos abaixo.`
              : "Acompanha o estado do teu processo de recrutamento passo a passo."}
        </p>

        {/* Primary Action Button if relevant */}
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          {activePhase ? (
            (() => {
              const id = activePhase.clientIdentifier?.trim().toLowerCase();
              const actionUrl = progressPhaseActions[id];
              if (id === "entrevista" && !interviewDate && actionUrl) {
                return (
                  <Link
                    href={actionUrl}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "gap-2 px-6 h-12 text-base",
                    )}
                  >
                    Agendar a tua Entrevista
                    <ArrowRight className="size-4" />
                  </Link>
                );
              }
              if (id === "dinâmica" && !dynamicDate && actionUrl) {
                return (
                  <Link
                    href={actionUrl}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "gap-2 px-6 h-12 text-base",
                    )}
                  >
                    Agendar a tua Dinâmica de Grupo
                    <ArrowRight className="size-4" />
                  </Link>
                );
              }
              return null;
            })()
          ) : allCompleted ? (
            <Link
              href="/candidate/result"
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2 px-6 h-12 text-base",
              )}
            >
              Ver Resultados Finais
              <ArrowRight className="size-4" />
            </Link>
          ) : null}

          <Link
            href="/application"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "px-6 h-12 text-base",
            )}
          >
            Ver a Minha Candidatura
          </Link>
        </div>
      </div>

      {/* Steps List - Center, big text, no visual dividers */}
      <div className="w-full space-y-6 pt-4">
        {progressPhases.map((phase, index) => {
          const id = phase.clientIdentifier?.trim().toLowerCase();
          const actionUrl = progressPhaseActions[id];
          const isStarted = phase.start ? new Date(phase.start) <= now : false;
          const isEnded = phase.end ? new Date(phase.end) < now : false;

          let eventDate = null;
          if (id === "entrevista") eventDate = interviewDate;
          if (id === "dinâmica") eventDate = dynamicDate;

          const isCurrent = isStarted && !isEnded && !phase.checked;

          return (
            <div
              key={phase.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 text-left"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      phase.checked
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {phase.checked ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      "text-lg sm:text-xl font-bold tracking-tight",
                      phase.checked
                        ? "text-foreground"
                        : isCurrent
                          ? "text-primary"
                          : "text-muted-foreground",
                    )}
                  >
                    {phase.title}
                  </span>
                </div>

                {eventDate && (
                  <p className="text-xs text-muted-foreground pl-10">
                    Agendado para: <strong>{eventDate}</strong>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 sm:self-center pl-10 sm:pl-0">
                {phase.checked ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Concluído
                  </span>
                ) : isCurrent ? (
                  actionUrl ? (
                    <Link
                      href={actionUrl}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "text-xs h-8",
                      )}
                    >
                      {id === "entrevista" || id === "dinâmica"
                        ? eventDate
                          ? "Alterar Horário"
                          : "Agendar"
                        : "Aceder"}
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-primary">
                      A decorrer
                    </span>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground/70">
                    {isEnded ? "Finalizado" : "Por iniciar"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
