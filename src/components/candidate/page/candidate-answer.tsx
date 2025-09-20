import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

export interface CandidateAnswerProps {
  title: string;
  content: string | null;
}

export default function CandidateAnswer({
  title,
  content,
}: CandidateAnswerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col gap-2 ml-8 border w-full rounded-md shadow-sm"
    >
      <div className="flex gap-4 p-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <ChevronsUpDown />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>

        <h4 className="text-lg">{title}</h4>
      </div>
      <CollapsibleContent className="flex flex-col gap-2 w-full ml-4">
        <div className="px-4 py-2 font-mono text-sm">{content}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
