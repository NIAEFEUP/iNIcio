"use client";

import { Application } from "@/lib/db";
import CandidateAnswer from "./candidate-answer";
import { useState } from "react";

export interface CandidateAnswersProps {
  application: Application | null;
}

const answers = [
  {
    title: "Interesse nas escolhas",
    attribute: "interestJustification",
  },
  {
    title: "Porquê o NI?",
    attribute: "motivation",
  },
  {
    title: "O que poderíamos ganhar contigo?",
    attribute: "selfPromotion",
  },
  {
    title: "Tens alguma sugestão?",
    attribute: "suggestions",
  },
  {
    title: "Com que tecnologias/ferramentas já trabalhaste?",
    attribute: "experience",
  },
];

export default function CandidateAnswers({
  application,
}: CandidateAnswersProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {answers.map((answer, idx) => (
        <CandidateAnswer
          id={idx}
          key={answer.attribute}
          title={answer.title}
          content={application ? application[answer.attribute] : ""}
          openItems={openItems}
          toggleItem={toggleItem}
        />
      ))}
    </div>
  );
}
