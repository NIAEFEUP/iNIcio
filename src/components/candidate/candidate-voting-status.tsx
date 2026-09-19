import { CheckCircle2, Vote, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type VotingDecision = {
  votingPhaseId: number;
  voteFinished: boolean;
  approveCount: number;
  rejectCount: number;
  decision: "approve" | "reject";
  createdAt: Date | null;
};

interface CandidateVotingStatusProps {
  votingDecision: VotingDecision | void | null;
}

function Stat({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1.5">
      {icon}
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function CandidateVotingStatus({
  votingDecision,
}: CandidateVotingStatusProps) {
  if (!votingDecision) {
    return null;
  }

  const isApproved = votingDecision.decision === "approve";
  const totalVotes = votingDecision.approveCount + votingDecision.rejectCount;

  return (
    <Card className="shadow-xs">
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/50",
            isApproved
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400",
          )}
        >
          {isApproved ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <XCircle className="size-5" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Estado da Votação
            </h3>
            <Badge
              variant={isApproved ? "default" : "destructive"}
              className={cn(
                isApproved && "bg-green-600 hover:bg-green-700 text-white",
              )}
            >
              {isApproved ? "Aprovado" : "Rejeitado"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Stat
              icon={
                <CheckCircle2 className="size-3 text-green-600 dark:text-green-400" />
              }
              value={`${votingDecision.approveCount} aprovações`}
            />
            <Stat
              icon={
                <XCircle className="size-3 text-red-600 dark:text-red-400" />
              }
              value={`${votingDecision.rejectCount} rejeições`}
            />
            <Stat
              icon={<Vote className="size-3" />}
              value={`${totalVotes} votos no total`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
