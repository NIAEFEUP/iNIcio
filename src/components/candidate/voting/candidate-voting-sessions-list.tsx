"use client";

import Link from "next/link";
import { Vote, ArrowRight, UserCheck, Calendar } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getDateStringPT, getTimeString } from "@/lib/date";
import { cn } from "@/lib/utils";

interface VotingPhaseSummary {
  id: number;
  recruitmentId: number;
  created_at: Date | null;
  status?: {
    candidateId: string | null;
    accepted_candidates: number;
    rejected_candidates: number;
  } | null;
  candidates?: Array<{
    candidateId: string;
    voteFinished: boolean;
  }>;
}

interface CandidateVotingSessionsListProps {
  votingPhases: Array<VotingPhaseSummary>;
}

export function CandidateVotingSessionsList({
  votingPhases,
}: CandidateVotingSessionsListProps) {
  if (!votingPhases || votingPhases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
          <Vote className="size-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground">
            Nenhuma sessão de votação
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
            Ainda não foi criada nenhuma sessão de votação neste recrutamento.
            Para iniciar uma nova votação, seleciona os candidatos na página de
            Candidatos e clica em <strong>Criar votação</strong>.
          </p>
        </div>
        <Link
          href="/candidates"
          className={cn(buttonVariants({ variant: "default" }), "gap-2")}
        >
          <UserCheck className="size-4" />
          <span>Ir para Candidatos</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Histórico de Votações
          </h2>
          <p className="text-xs text-muted-foreground">
            {votingPhases.length}{" "}
            {votingPhases.length === 1
              ? "sessão registada"
              : "sessões registadas"}
          </p>
        </div>
        <Link
          href="/candidates"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-2 text-xs",
          )}
        >
          <UserCheck className="size-3.5" />
          <span>Selecionar candidatos</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {votingPhases.map((vp) => {
          const totalCandidates = vp.candidates?.length ?? 0;
          const finishedCandidates =
            vp.candidates?.filter((c) => c.voteFinished).length ?? 0;
          const isFinished =
            totalCandidates > 0 && finishedCandidates === totalCandidates;
          const accepted = vp.status?.accepted_candidates ?? 0;
          const rejected = vp.status?.rejected_candidates ?? 0;

          return (
            <div
              key={vp.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-xs hover:border-primary/40 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Calendar className="size-3.5" />
                  <span>
                    {vp.created_at
                      ? `${getDateStringPT(vp.created_at)}, ${getTimeString(vp.created_at)}`
                      : "Data desconhecida"}
                  </span>
                  <span>·</span>
                  <span
                    className={
                      isFinished
                        ? "text-muted-foreground"
                        : "text-emerald-600 dark:text-emerald-400 font-semibold"
                    }
                  >
                    {isFinished ? "Concluída" : "Em curso"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground">
                  Sessão #{vp.id}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    <strong>{totalCandidates}</strong> candidatos
                  </span>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {accepted} aceites
                  </span>
                  <span>·</span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    {rejected} rejeitados
                  </span>
                </div>
              </div>

              <div className="flex items-center sm:justify-end">
                <Link
                  href={`/candidates/voting/${vp.id}`}
                  className={cn(
                    buttonVariants({
                      variant: isFinished ? "outline" : "default",
                      size: "sm",
                    }),
                    "gap-1.5 w-full sm:w-auto",
                  )}
                >
                  <span>Abrir sessão</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
