"use client";

import { CheckCircle2, Clock, Vote, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type CandidateVotingDecision = {
  votingPhaseId: number;
  voteFinished: boolean;
  approveCount: number;
  rejectCount: number;
  decision: "approve" | "reject";
  createdAt: Date | null;
};

export interface CandidateResultVotingCardProps {
  votingDecision?: CandidateVotingDecision | null;
  className?: string;
}

export function CandidateResultVotingCard({
  votingDecision,
  className,
}: CandidateResultVotingCardProps) {
  const decision =
    votingDecision && typeof votingDecision === "object"
      ? votingDecision
      : null;
  const isApproved = decision?.decision === "approve";
  const isRejected = decision?.decision === "reject";
  const totalVotes = decision
    ? decision.approveCount + decision.rejectCount
    : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        <span>Resultado e Votação</span>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground font-medium">
            Decisão final
          </span>
          {decision ? (
            isApproved ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Aprovado
              </span>
            ) : isRejected ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400">
                <XCircle className="size-4" />
                Rejeitado
              </span>
            ) : null
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-4" />
              Pendente
            </span>
          )}
        </div>

        {decision ? (
          <div className="space-y-2 border-t border-border/50 pt-3">
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-lg bg-muted/40 py-2.5 px-1.5">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Aprovações
                </p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {decision.approveCount}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 py-2.5 px-1.5">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Rejeições
                </p>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {decision.rejectCount}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 py-2.5 px-1.5">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Total
                </p>
                <p className="text-sm font-bold text-foreground mt-1">
                  {totalVotes}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CandidateResultVotingCard;
