import { Check, Users, X } from "lucide-react";

interface CandidateVotingStatsProps {
  currentCandidateVotes: number;
  votedCount: number;
  totalToVote: number;
  approvedCount: number;
  rejectedCount: number;
}

export default function CandidateVotingStats({
  currentCandidateVotes,
  votedCount,
  totalToVote,
  approvedCount,
  rejectedCount,
}: CandidateVotingStatsProps) {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center gap-6">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Progresso</p>
            <p className="text-lg font-medium text-foreground">
              {votedCount} / {totalToVote}
            </p>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="flex gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-secondary" />
                <span className="text-lg font-medium text-foreground">
                  {approvedCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Aceites</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1.5">
                <X className="h-4 w-4 text-destructive" />
                <span className="text-lg font-medium text-foreground">
                  {rejectedCount}
                </span>
              </div>
              <p className="text-xs text-destructive/80">Rejeitados</p>
            </div>
          </div>
        </div>

        <section>
          <div className="flex flex-row gap-1">
            <Users className="h-6 w-6 text-muted-foreground" />
            {currentCandidateVotes}
          </div>
        </section>
      </div>
    </div>
  );
}
