import { Checkbox } from "@/components/ui/checkbox";
import { CandidateWithMetadata } from "@/lib/candidate";
import { Label } from "@radix-ui/react-label";
import { useEffect, useState } from "react";

interface CandidateQuickInfoSelectProps {
  candidate: CandidateWithMetadata;
  selectActionHandler: (
    checked: boolean,
    candidate: CandidateWithMetadata,
  ) => void;
  candidateSelected?: boolean;
}

export default function CandidateQuickInfoSelect({
  candidate,
  selectActionHandler,
  candidateSelected = false,
}: CandidateQuickInfoSelectProps) {
  const [checked, setChecked] = useState<boolean>(candidateSelected);

  useEffect(() => {
    setChecked(candidateSelected);
  }, [candidateSelected]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Checkbox
          id={`select-candidate-${candidate.id}`}
          className="h-5 w-5 border-2 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-200"
          checked={checked}
          onCheckedChange={(checked: boolean) => {
            selectActionHandler(checked, candidate);
            setChecked(checked);
          }}
        />
      </div>
      <Label
        htmlFor={`select-candidate-${candidate.id}`}
        className="text-sm font-medium tracking-wide text-foreground/80 cursor-pointer hover:text-foreground transition-colors"
      >
        Selecionar
      </Label>
    </div>
  );
}
