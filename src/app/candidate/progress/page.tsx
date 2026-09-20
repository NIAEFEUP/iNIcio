import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";

import { hasApplication } from "@/lib/application";
import { auth } from "@/lib/auth";
import getCandidateWithInterviewAndDynamic from "@/lib/candidate";
import {
  getActiveRecruitment,
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
  candidatura: "/#candidaturas",
  resultado: "/#candidaturas",
};

type CandidateProgressProps = {
  searchParams?: Promise<{ recruitmentId?: string }>;
};

export default async function CandidateProgress({
  searchParams,
}: CandidateProgressProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const targetRecruitmentId = resolvedSearchParams?.recruitmentId
    ? Number(resolvedSearchParams.recruitmentId)
    : undefined;

  const activeRecruitment = await getActiveRecruitment();

  if (!activeRecruitment) {
    redirect("/");
  }

  if (targetRecruitmentId && targetRecruitmentId !== activeRecruitment.id) {
    redirect("/");
  }

  const hasAppliedActive = await hasApplication(
    session.user.id,
    activeRecruitment.id,
  );
  if (!hasAppliedActive) {
    redirect("/");
  }

  const rawPhases = await getRecruitmentPhases(
    "candidate",
    activeRecruitment.id,
  );

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
    activeRecruitment.id,
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

  const activePhase = progressPhases.find((phase) => {
    const isOngoing = phase.start <= now && phase.end >= now;
    return isOngoing && !phase.checked;
  });

  const completedCount = progressPhases.filter((p) => p.checked).length;
  const progressPercent =
    progressPhases.length > 0
      ? Math.round((completedCount / progressPhases.length) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          Processo de Recrutamento
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
          O Teu Progresso.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Acompanha cada etapa do teu percurso para te juntares à equipa do
          NIAEFEUP. Mantém-te atento às datas e convites!
        </p>

        {/* Global Progress Bar */}
        <div className="max-w-md mx-auto pt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>Progresso Geral</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/50">
            <div
              className="bg-primary h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Action Banner / Status Alert */}
      {activePhase ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-1.5 text-center sm:text-left z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Fase Ativa
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              {activePhase.title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {activePhase.description ||
                "Esta etapa encontra-se atualmente a decorrer. Completa a tua ação para avançares no processo."}
            </p>
          </div>

          {progressPhaseActions[activePhase.clientIdentifier] && (
            <Link
              href={progressPhaseActions[activePhase.clientIdentifier]}
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2 shrink-0 z-10 w-full sm:w-auto font-medium shadow-sm",
              )}
            >
              {activePhase.clientIdentifier === "candidatura"
                ? "Ver Candidatura"
                : "Agendar / Participar"}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      ) : null}

      {/* Interactive Phase Timeline */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">
          Etapas da Candidatura
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progressPhases.map((phase, index) => {
            const isCompleted = phase.checked;
            const isCurrent = phase.id === activePhase?.id;
            const isFuture = phase.start > now;
            const actionLink = progressPhaseActions[phase.clientIdentifier];

            return (
              <div
                key={phase.id}
                className={cn(
                  "flex flex-col justify-between p-6 rounded-2xl border transition-all duration-200",
                  isCompleted
                    ? "bg-card border-border/80"
                    : isCurrent
                      ? "bg-card border-primary ring-1 ring-primary shadow-xs"
                      : "bg-muted/20 border-border/40 opacity-70",
                )}
              >
                <div className="space-y-4">
                  {/* Top indicator & step number */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-muted-foreground">
                      ETAPA 0{index + 1}
                    </span>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <Check className="size-3 stroke-[3]" /> Concluído
                      </span>
                    ) : isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 animate-pulse">
                        A decorrer
                      </span>
                    ) : isFuture ? (
                      <span className="text-xs font-medium text-muted-foreground/80 bg-muted px-2.5 py-0.5 rounded-full">
                        Futuro
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                        Pendente
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {phase.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                      {phase.description}
                    </p>
                  </div>

                  {/* Scheduled Slot Badges */}
                  {phase.clientIdentifier === "entrevista" && interviewDate && (
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-xs space-y-1">
                      <span className="text-muted-foreground font-medium block">
                        Entrevista Agendada:
                      </span>
                      <span className="font-semibold text-foreground">
                        {interviewDate}
                      </span>
                    </div>
                  )}

                  {phase.clientIdentifier === "dinâmica" && dynamicDate && (
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-xs space-y-1">
                      <span className="text-muted-foreground font-medium block">
                        Dinâmica Agendada:
                      </span>
                      <span className="font-semibold text-foreground">
                        {dynamicDate}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action / CTA */}
                {actionLink && (
                  <div className="pt-6 mt-2 border-t border-border/50 flex justify-end">
                    <Link
                      href={actionLink}
                      className={cn(
                        buttonVariants({
                          variant: isCurrent
                            ? "default"
                            : isCompleted
                              ? "outline"
                              : "ghost",
                          size: "sm",
                        }),
                        "text-xs gap-1.5 w-full sm:w-auto",
                        !isCurrent &&
                          !isCompleted &&
                          "pointer-events-none opacity-40",
                      )}
                    >
                      {phase.clientIdentifier === "candidatura"
                        ? "Ver Respostas"
                        : isCompleted
                          ? "Ver Detalhes"
                          : "Completar Etapa"}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
