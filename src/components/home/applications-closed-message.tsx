import { Clock } from "lucide-react";

import RecruitmentPhaseTimeline from "./recruitment-phase-timeline";
import type { RecruitmentPhase } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

interface ApplicationsClosedMessageProps {
  phases: RecruitmentPhase[];
  /** Phase details are only shown to authenticated users. */
  isAuthenticated: boolean;
}

export default function ApplicationsClosedMessage({
  phases,
  isAuthenticated,
}: ApplicationsClosedMessageProps) {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-7xl text-center">
      <div className="flex flex-col items-center space-y-4">
        <Badge
          variant="secondary"
          className="gap-1.5 py-1 px-3 text-xs font-medium"
        >
          <Clock className="size-3.5" />
          Fase de Candidaturas Terminada
        </Badge>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
          As candidaturas já fecharam
        </h1>

        <p className="text-base md:text-lg text-muted-foreground text-pretty max-w-xl mx-auto leading-relaxed">
          {isAuthenticated
            ? "O recrutamento continua para quem já submeteu a sua candidatura! Acompanha abaixo o calendário das restantes fases."
            : "O período de candidaturas para esta época terminou. Obrigado pelo teu interesse no NIAEFEUP!"}
        </p>

        {isAuthenticated && <RecruitmentPhaseTimeline phases={phases} />}
      </div>
    </div>
  );
}
