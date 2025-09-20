"use client";

import { Application } from "@/lib/db";
import CandidateAnswer from "./candidate-answer";

export interface CandidateAnswersProps {
  application: Application | null;
}

export default function CandidateAnswers({
  application,
}: CandidateAnswersProps) {
  return (
    <div className="flex flex-col gap-4 w-3/4">
      <CandidateAnswer
        title="Interesse nas escolhas"
        content={application ? application.interestJustification : ""}
      />

      <CandidateAnswer
        title="Porquê o NI?"
        content={application ? application.motivation : ""}
      />

      <CandidateAnswer
        title="O que poderíamos ganhar contigo?"
        content={application ? application.selfPromotion : ""}
      />

      <CandidateAnswer
        title="Tens alguma sugestão?"
        content={application ? application.suggestions : ""}
      />

      <CandidateAnswer
        title="Com que tecnologias/ferramentas já trabalhaste?"
        content={application ? application.experience : ""}
      />
    </div>
  );
}
