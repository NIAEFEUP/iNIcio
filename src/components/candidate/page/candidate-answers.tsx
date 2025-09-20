"use client";

import { User } from "@/lib/db";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

export interface CandidateAnswersProps {
  answer: {
    title: string;
    content: string;
  };
}

export default function CandidateAnswers({ answer }: CandidateAnswersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col gap-2 ml-8"
    >
      <div className="flex items-center justify-between gap-4 px-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <ChevronsUpDown />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>

        <h4 className="text-lg font-semibold">{answer.title}</h4>
      </div>
      <CollapsibleContent className="flex flex-col gap-2 w-full ml-4">
        <div className="px-4 py-2 font-mono text-sm">{answer.content}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
