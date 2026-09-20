"use client";

import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CandidateApplicationModal } from "./candidate-application-modal";
import { CandidateResultModal } from "./candidate-result-modal";
import {
  CandidateScheduleModal,
  type CandidateSlotOption,
} from "./candidate-schedule-modal";
import type { UserApplicationWithDetails } from "@/lib/application";
import type { CandidateRecruitmentResult } from "@/lib/final-messages";

export interface CandidatePhaseViewData {
  id: number;
  title: string;
  description: string | null;
  clientIdentifier: string;
  start: string | null;
  end: string | null;
  checked: boolean;
}

export interface CandidateSlotData {
  id: number;
  start: string;
  duration: number;
}

export interface CandidateProgressViewProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image?: string | null;
  };
  recruitment: {
    id: number;
    title: string;
    lectiveYear?: string | null;
    semester?: number | null;
    start: string;
    end: string;
  };
  phases: CandidatePhaseViewData[];
  application: UserApplicationWithDetails;
  result: CandidateRecruitmentResult | null;
  interviewSlot: CandidateSlotData | null;
  dynamicSlot: CandidateSlotData | null;
  interviewSlots?: CandidateSlotOption[];
  dynamicSlots?: CandidateSlotOption[];
}

function formatDateRange(startStr: string | null, endStr: string | null) {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr);
  const end = new Date(endStr);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString("pt-PT", { month: "short" });
  const endMonth = end.toLocaleDateString("pt-PT", { month: "short" });

  if (startMonth === endMonth) {
    return `${startDay} — ${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth} — ${endDay} ${endMonth}`;
}

function formatAppointmentDate(startStr: string, durationMinutes: number) {
  const start = new Date(startStr);
  const formattedDate = start.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const formattedTime = start.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formattedDate} às ${formattedTime} (${durationMinutes} min)`;
}

export function CandidateProgressView({
  user,
  recruitment,
  phases,
  application,
  result,
  interviewSlot,
  dynamicSlot,
  interviewSlots = [],
  dynamicSlots = [],
}: CandidateProgressViewProps) {
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isDynamicModalOpen, setIsDynamicModalOpen] = useState(false);

  const completedPhasesCount = phases.filter((p) => p.checked).length;
  const progressPercent =
    phases.length > 0
      ? Math.round((completedPhasesCount / phases.length) * 100)
      : 0;

  const now = new Date();
  const isResultReady = Boolean(
    result &&
    (result.decision === "approved" || result.decision === "rejected"),
  );

  // Check phase open status for scheduling modals
  const interviewPhaseData = phases.find(
    (p) => p.clientIdentifier.trim().toLowerCase() === "entrevista",
  );
  const dynamicPhaseData = phases.find(
    (p) => p.clientIdentifier.trim().toLowerCase() === "dinâmica",
  );

  const isInterviewPhaseOpen = Boolean(
    interviewPhaseData &&
    (!interviewPhaseData.start || now >= new Date(interviewPhaseData.start)) &&
    (!interviewPhaseData.end || now <= new Date(interviewPhaseData.end)),
  );

  const isDynamicPhaseOpen = Boolean(
    dynamicPhaseData &&
    (!dynamicPhaseData.start || now >= new Date(dynamicPhaseData.start)) &&
    (!dynamicPhaseData.end || now <= new Date(dynamicPhaseData.end)),
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {recruitment.title}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Progresso da Candidatura
          </h1>
        </div>
      </div>

      <div className="space-y-4">
        {phases.map((rawPhase, idx) => {
          const kind = rawPhase.clientIdentifier.trim().toLowerCase();
          const isCompleted = rawPhase.checked;
          const start = rawPhase.start ? new Date(rawPhase.start) : null;
          const end = rawPhase.end ? new Date(rawPhase.end) : null;
          const isOngoing =
            start && end ? now >= start && now <= end && !isCompleted : false;
          const isUpcoming = start ? now < start : false;
          const isPhaseOpen = (!start || now >= start) && (!end || now <= end);

          let statusLabel = "Pendente";
          let dotColor = "bg-muted-foreground/30";
          let textColor = "text-muted-foreground";

          if (isCompleted) {
            statusLabel = "Concluído";
            dotColor = "bg-emerald-500";
            textColor = "text-emerald-600 dark:text-emerald-400";
          } else if (isOngoing) {
            statusLabel = "A decorrer";
            dotColor = "bg-primary animate-pulse";
            textColor = "text-primary";
          } else if (isUpcoming) {
            statusLabel = "Futura";
            dotColor = "bg-muted-foreground/40";
            textColor = "text-muted-foreground";
          }

          const isActionRequired = isOngoing && !isCompleted;
          const dateRange = formatDateRange(rawPhase.start, rawPhase.end);

          const phase = {
            ...rawPhase,
            kind,
            statusLabel,
            dateRange,
          };

          return (
            <div
              key={phase.id}
              className={cn(
                "rounded-2xl border p-6 sm:p-7 transition-all duration-200",
                isCompleted
                  ? "bg-card border-border/80"
                  : isOngoing
                    ? "bg-card border-primary/50 ring-1 ring-primary/20 shadow-xs"
                    : "bg-muted/10 border-border/40 opacity-70",
              )}
            >
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs font-mono font-semibold text-muted-foreground">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground">
                        {phase.title}
                      </h3>
                      {phase.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {phase.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pl-7 sm:pl-0">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <span
                        className={cn("size-2 rounded-full shrink-0", dotColor)}
                      />
                      <span className={textColor}>{phase.statusLabel}</span>
                    </div>
                    {phase.dateRange && (
                      <span className="text-xs text-muted-foreground">
                        {phase.dateRange}
                      </span>
                    )}
                  </div>
                </div>

                {phase.kind === "candidatura" && application && (
                  <div className="mt-4 pt-4 border-t border-border/40 pl-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {application.submittedAt
                        ? `Submetida em ${new Date(application.submittedAt).toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}`
                        : "Candidatura submetida"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsAppModalOpen(true)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "text-xs cursor-pointer font-medium w-fit",
                      )}
                    >
                      Ver detalhes da candidatura
                    </button>
                  </div>
                )}

                {phase.kind === "entrevista" && (
                  <div className="mt-4 pt-4 border-t border-border/40 pl-6">
                    {interviewSlot ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            Horário marcado:{" "}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatAppointmentDate(
                              interviewSlot.start,
                              interviewSlot.duration,
                            )}
                          </span>
                        </div>

                        {isInterviewPhaseOpen ? (
                          <button
                            type="button"
                            onClick={() => setIsInterviewModalOpen(true)}
                            className={cn(
                              buttonVariants({
                                variant: "outline",
                                size: "sm",
                              }),
                              "text-xs font-medium w-fit cursor-pointer",
                            )}
                          >
                            Alterar horário
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground/70 italic">
                            Período de agendamento encerrado
                          </span>
                        )}
                      </div>
                    ) : isInterviewPhaseOpen ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                          O período de agendamento de entrevistas está ativo.
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsInterviewModalOpen(true)}
                          className={cn(
                            buttonVariants({ size: "sm" }),
                            "text-xs font-medium w-fit cursor-pointer",
                          )}
                        >
                          Agendar horário
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>
                          {isUpcoming
                            ? "O agendamento de entrevistas estará disponível durante o período desta fase."
                            : "O período de agendamento de entrevistas terminou."}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {phase.kind === "dinâmica" && (
                  <div className="mt-4 pt-4 border-t border-border/40 pl-6">
                    {dynamicSlot ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            Sessão marcada:{" "}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatAppointmentDate(
                              dynamicSlot.start,
                              dynamicSlot.duration,
                            )}
                          </span>
                        </div>

                        {isDynamicPhaseOpen ? (
                          <button
                            type="button"
                            onClick={() => setIsDynamicModalOpen(true)}
                            className={cn(
                              buttonVariants({
                                variant: "outline",
                                size: "sm",
                              }),
                              "text-xs font-medium w-fit cursor-pointer",
                            )}
                          >
                            Alterar sessão
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground/70 italic">
                            Período de inscrições encerrado
                          </span>
                        )}
                      </div>
                    ) : isDynamicPhaseOpen ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                          As inscrições para a dinâmica de grupo encontram-se
                          abertas.
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsDynamicModalOpen(true)}
                          className={cn(
                            buttonVariants({ size: "sm" }),
                            "text-xs font-medium w-fit cursor-pointer",
                          )}
                        >
                          Agendar sessão
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>
                          {isUpcoming
                            ? "A inscrição na dinâmica de grupo estará disponível durante o período desta fase."
                            : "O período de inscrições para a dinâmica de grupo terminou."}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {(phase.kind === "votacao" || phase.kind === "resultado") && (
                  <div className="mt-4 pt-4 border-t border-border/40 pl-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {isResultReady
                        ? "A decisão final já se encontra disponível."
                        : "A decisão final será publicada após a conclusão de todas as fases."}
                    </span>

                    {isResultReady && (
                      <button
                        type="button"
                        onClick={() => setIsResultModalOpen(true)}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "text-xs cursor-pointer font-medium w-fit",
                        )}
                      >
                        Ver resultado
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CandidateApplicationModal
        open={isAppModalOpen}
        onOpenChange={setIsAppModalOpen}
        application={application}
        user={user}
      />

      <CandidateResultModal
        open={isResultModalOpen}
        onOpenChange={setIsResultModalOpen}
        result={result}
      />

      <CandidateScheduleModal
        open={isInterviewModalOpen}
        onOpenChange={setIsInterviewModalOpen}
        type="interview"
        title="Agendamento de Entrevista"
        description="Seleciona um dos horários disponíveis para realizares a tua entrevista individual."
        slots={interviewSlots}
        currentSlot={interviewSlot}
        isPhaseOpen={isInterviewPhaseOpen}
      />

      <CandidateScheduleModal
        open={isDynamicModalOpen}
        onOpenChange={setIsDynamicModalOpen}
        type="dynamic"
        title="Inscrição na Dinâmica de Grupo"
        description="Escolhe uma sessão para participares na dinâmica de grupo com a equipa."
        slots={dynamicSlots}
        currentSlot={dynamicSlot}
        isPhaseOpen={isDynamicPhaseOpen}
      />
    </div>
  );
}
