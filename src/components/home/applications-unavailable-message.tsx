import { Clock } from "lucide-react";

import RecruitmentPhaseTimeline from "./recruitment-phase-timeline";
import type { RecruitmentPhase } from "@/lib/db";

interface ApplicationsUnavailableMessageProps {
  phases: RecruitmentPhase[];
  /** When the application phase opens, if it is scheduled. */
  opensAt?: Date | null;
}

export default function ApplicationsUnavailableMessage({
  phases,
  opensAt = null,
}: ApplicationsUnavailableMessageProps) {
  return (
    <section className="bg-gradient-to-br from-background via-muted/30 to-primary/5 w-full h-full">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Status indicator */}
          <div className="inline-flex items-center gap-2 bg-muted/50 text-muted-foreground px-4 py-2 rounded-full text-sm mb-8">
            <Clock className="h-4 w-4" />
            Estado do Recrutamento
          </div>

          {opensAt ? (
            <>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-6">
                As candidaturas abrem{" "}
                <span className="text-primary">em breve</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto leading-relaxed">
                O período de candidaturas começa a{" "}
                <span className="text-primary font-semibold">
                  {new Date(opensAt).toLocaleString("pt-PT")}
                </span>
                . Fica atento!
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-6">
                As candidaturas ainda{" "}
                <span className="text-primary">não estão abertas</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto leading-relaxed">
                O período de candidaturas ainda não foi definido. Acompanha
                abaixo as fases do recrutamento.
              </p>
            </>
          )}

          <RecruitmentPhaseTimeline phases={phases} />
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl"></div>
    </section>
  );
}
