"use client";

import { useMemo, useState } from "react";
import { Search, SquareSquare } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CandidateVotingMetadata } from "@/lib/candidate";

interface VotingSessionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  votingPhaseId?: number;
  candidates: CandidateVotingMetadata[];
  currentCandidateId: string;
  onSelectCandidate: (index: number) => void;
  finishedCandidateIds: Set<string>;
  voteCountsByCandidate: Record<
    string,
    { approved: number; rejected: number; voted: number }
  >;
  acceptedCandidates: number;
  rejectedCandidates: number;
  recruitersConnected: number;
  isTerminated: boolean;
  onOpenTerminateDialog: () => void;
}

export function VotingSessionDrawer({
  open,
  onOpenChange,
  candidates,
  currentCandidateId,
  onSelectCandidate,
  finishedCandidateIds,
  voteCountsByCandidate,
  acceptedCandidates,
  rejectedCandidates,
  recruitersConnected,
  isTerminated,
  onOpenTerminateDialog,
}: VotingSessionDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const finishedCount = candidates.filter((c) =>
    finishedCandidateIds.has(c.id),
  ).length;

  const finishedPercent =
    candidates.length > 0
      ? Math.round((finishedCount / candidates.length) * 100)
      : 0;

  const pendingCount = Math.max(0, candidates.length - finishedCount);

  const filteredCandidates = useMemo(() => {
    const list = candidates.map((candidate, originalIndex) => ({
      candidate,
      originalIndex,
    }));
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(({ candidate }) =>
      (candidate.name ?? "").toLowerCase().includes(q),
    );
  }, [candidates, searchQuery]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border/70 text-left shrink-0">
          <SheetTitle className="text-base font-semibold text-foreground">
            Sessão de Votação
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {recruitersConnected}{" "}
            {recruitersConnected === 1
              ? "recrutador ligado"
              : "recrutadores ligados"}
          </SheetDescription>
        </SheetHeader>

        {/* Progress Overview Section */}
        <div className="p-4 border-b border-border/70 bg-muted/20 space-y-3 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">
              Progresso da Sessão
            </span>
            <span className="font-semibold text-foreground">
              {finishedCount} de {candidates.length} decididos (
              {finishedPercent}%)
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${finishedPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="rounded-lg border border-border/60 bg-card p-2 text-center shadow-2xs">
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Aceites
              </div>
              <div className="mt-0.5 text-base font-bold text-foreground">
                {acceptedCandidates}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-2 text-center shadow-2xs">
              <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                Rejeitados
              </div>
              <div className="mt-0.5 text-base font-bold text-foreground">
                {rejectedCandidates}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-2 text-center shadow-2xs">
              <div className="text-[11px] font-medium text-muted-foreground">
                Pendentes
              </div>
              <div className="mt-0.5 text-base font-bold text-foreground">
                {pendingCount}
              </div>
            </div>
          </div>
        </div>

        {/* Candidates Glance (Scrollable List) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Candidatos ({candidates.length})
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar candidato…"
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="space-y-2 pt-1">
            {filteredCandidates.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Nenhum candidato encontrado.
              </div>
            ) : (
              filteredCandidates.map(({ candidate, originalIndex }) => {
                const counts = voteCountsByCandidate[candidate.id] ?? {
                  approved: 0,
                  rejected: 0,
                  voted: 0,
                };
                const isFinished = finishedCandidateIds.has(candidate.id);
                const isCurrent = candidate.id === currentCandidateId;
                const totalVotes = counts.approved + counts.rejected;
                const approvedPct =
                  totalVotes > 0
                    ? Math.round((counts.approved / totalVotes) * 100)
                    : 0;

                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => {
                      onSelectCandidate(originalIndex);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "w-full rounded-xl border p-3.5 text-left transition-all",
                      isCurrent
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
                        : "border-border/70 bg-card hover:bg-muted/40 hover:border-border",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {candidate.name || "Sem nome"}
                        </span>
                        {isCurrent && (
                          <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            Atual
                          </span>
                        )}
                      </div>

                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                          isFinished
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : counts.voted > 0
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isFinished
                          ? "Decidido"
                          : counts.voted > 0
                            ? "A votar"
                            : "Pendente"}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>
                        Entrevista: {candidate.interviewClassification || "—"}
                      </span>
                      <span>·</span>
                      <span>
                        Dinâmica: {candidate.dynamicClassification || "—"}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      {counts.voted > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="bg-emerald-500 transition-all duration-300"
                              style={{ width: `${approvedPct}%` }}
                            />
                            <div
                              className="bg-rose-500 transition-all duration-300"
                              style={{ width: `${100 - approvedPct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {counts.approved} aceitar ({approvedPct}%)
                            </span>
                            <span className="font-medium text-rose-600 dark:text-rose-400">
                              {counts.rejected} rejeitar ({100 - approvedPct}%)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground/80 italic">
                          Sem votos submetidos
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer: End Session Button */}
        <div className="p-4 border-t border-border/70 bg-card mt-auto shrink-0">
          {!isTerminated ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenTerminateDialog();
              }}
              className="w-full h-8.5 gap-2 text-xs font-semibold shadow-xs"
            >
              <SquareSquare className="size-3.5" />
              <span>Terminar sessão de votação</span>
            </Button>
          ) : (
            <div className="text-center text-xs text-muted-foreground py-1 font-medium">
              Esta sessão de votação está terminada.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
