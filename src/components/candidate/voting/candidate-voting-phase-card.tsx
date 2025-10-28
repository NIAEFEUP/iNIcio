import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDateStringPT, getTimeString } from "@/lib/date";
import Link from "next/link";

export default function CandidateVotingPhaseCard({ votingPhase }) {
  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-accent/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="relative z-10">
        Votação de dia {getDateStringPT(votingPhase.created_at)},{" "}
        {getTimeString(votingPhase.created_at)}
      </CardHeader>

      <CardContent className="relative z-10">
        <Button asChild>
          <Link href={`/candidates/voting/${votingPhase.id}`}>Ver votação</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
