"use client";

import { Check, Loader2, RefreshCcw, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CandidateVotesModalProps {
  candidateName: string;
  totalVotesCount: number;
  approvedVotesCount: number;
  rejectedVotesCount: number;
  approvedPercent: number;
  rejectedPercent: number;
  isFinished: boolean;
  isMakingDefinitive: boolean;
  isResetting: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMakeDefinitive: (decision: "accept" | "reject") => Promise<void> | void;
  onResetVotes: () => Promise<void> | void;
}

export function CandidateVotesModal({
  candidateName,
  totalVotesCount,
  approvedVotesCount,
  rejectedVotesCount,
  approvedPercent,
  rejectedPercent,
  isFinished,
  isMakingDefinitive,
  isResetting,
  open,
  onOpenChange,
  onMakeDefinitive,
  onResetVotes,
}: CandidateVotesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
            Votos · {candidateName}
          </DialogTitle>
          <DialogDescription>
            {totalVotesCount === 0
              ? "Ainda não foram submetidos votos por recrutadores."
              : `${totalVotesCount} ${
                  totalVotesCount === 1
                    ? "voto submetido por recrutadores."
                    : "votos submetidos por recrutadores."
                }`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Stats Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Check className="size-3.5" />
                <span>Aceitar</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {approvedPercent}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {approvedVotesCount}{" "}
                  {approvedVotesCount === 1 ? "voto" : "votos"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <X className="size-3.5" />
                <span>Rejeitar</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {rejectedPercent}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {rejectedVotesCount}{" "}
                  {rejectedVotesCount === 1 ? "voto" : "votos"}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Split Bar */}
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
            {totalVotesCount > 0 ? (
              <>
                <div
                  style={{ width: `${approvedPercent}%` }}
                  className="bg-emerald-500 transition-all duration-300"
                />
                <div
                  style={{ width: `${rejectedPercent}%` }}
                  className="bg-rose-500 transition-all duration-300"
                />
              </>
            ) : (
              <div className="w-full bg-muted" />
            )}
          </div>

          {/* Finished Status notice */}
          {isFinished && (
            <p className="text-xs text-muted-foreground pt-1">
              Decisão final já concluída para este candidato.
            </p>
          )}
        </div>

        <DialogFooter className="sm:justify-between items-center">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetVotes}
              disabled={isResetting}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2"
            >
              <RefreshCcw
                className={cn("size-3.5", isResetting && "animate-spin")}
              />
              <span>Reiniciar votos</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {!isFinished ? (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onMakeDefinitive("reject")}
                  disabled={isMakingDefinitive}
                  className="gap-1.5 text-xs h-8"
                >
                  {isMakingDefinitive ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <X className="size-3.5" />
                  )}
                  <span>Rejeitar</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => onMakeDefinitive("accept")}
                  disabled={isMakingDefinitive}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs h-8"
                >
                  {isMakingDefinitive ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  <span>Aceitar</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetVotes}
                  disabled={isResetting}
                  className="text-xs h-8"
                >
                  Reabrir votação
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs h-8"
                >
                  Fechar
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
