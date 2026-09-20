"use client";

import { Application } from "@/lib/db";
import CandidateAnswer from "./candidate-answer";
import { useState } from "react";
import { applicationAnswers } from "@/lib/candidate-answers";

export interface CandidateAnswersProps {
  application: Application | null;
}

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
      {applicationAnswers.map((answer, idx) => (
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
