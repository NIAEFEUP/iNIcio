import { CheckCircle2, XCircle, Vote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type VotingDecision = {
  votingPhaseId: number;
  voteFinished: boolean;
  approveCount: number;
  rejectCount: number;
  decision: "approve" | "reject";
  createdAt: Date | null;
};

interface CandidateVotingStatusProps {
  votingDecision: VotingDecision | null;
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
    <Card className="border-0 bg-gradient-to-br from-card via-card to-accent/10 shadow-md overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              isApproved
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            {isApproved ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-foreground">
                Estado da Votação
              </h3>
              <Badge
                variant={isApproved ? "default" : "destructive"}
                className={`text-xs ${
                  isApproved ? "bg-green-600 hover:bg-green-700 text-white" : ""
                }`}
              >
                {isApproved ? "Aprovado" : "Rejeitado"}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span>{votingDecision.approveCount} aprovações</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                <span>{votingDecision.rejectCount} rejeições</span>
              </div>
              <div className="flex items-center gap-1">
                <Vote className="h-3 w-3" />
                <span>{totalVotes} votos totais</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
