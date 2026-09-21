import { Clock, Calendar } from "lucide-react";

import RecruitmentPhaseTimeline from "./recruitment-phase-timeline";
import type { RecruitmentPhase } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

interface ApplicationsUnavailableMessageProps {
  phases: RecruitmentPhase[];
  /** When the application phase opens, if it is scheduled. */
  opensAt?: Date | null;
  /** Phase details are only shown to authenticated users. */
  isAuthenticated: boolean;
}

export default function ApplicationsUnavailableMessage({
  phases,
  opensAt = null,
  isAuthenticated,
}: ApplicationsUnavailableMessageProps) {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-7xl text-center">
      <div className="flex flex-col items-center space-y-4">
        <Badge
          variant="outline"
          className="gap-1.5 py-1 px-3 text-xs font-medium"
        >
          <Clock className="size-3.5 text-primary" />
          Estado do Recrutamento
        </Badge>

        {opensAt ? (
          <>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
              As candidaturas abrem{" "}
              <span className="text-primary">em breve</span>
            </h1>

            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground pt-1">
              <Calendar className="size-4 text-primary" />
              <span>
                Início a{" "}
                <strong className="text-foreground font-semibold">
                  {new Date(opensAt).toLocaleString("pt-PT")}
                </strong>
                . Fica atento!
              </span>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
              As candidaturas ainda não estão abertas
            </h1>

            <p className="text-base md:text-lg text-muted-foreground text-pretty max-w-xl mx-auto leading-relaxed">
              {isAuthenticated
                ? "O período de submissão de candidaturas ainda não começou. Consulta as fases abaixo para te manteres a par."
                : "O período de candidaturas ainda não foi iniciado. Fica atento às nossas redes e novidades."}
            </p>
          </>
        )}

        {isAuthenticated && <RecruitmentPhaseTimeline phases={phases} />}
      </div>
    </div>
  );
}
