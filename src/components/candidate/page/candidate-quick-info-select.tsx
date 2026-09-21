import { Checkbox } from "@/components/ui/checkbox";
import { CandidateWithMetadata } from "@/lib/candidate";
import { Label } from "@/components/ui/label";
import { useState } from "react";

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
  candidateSelected,
}: CandidateQuickInfoSelectProps) {
  const [isSelected, setIsSelected] = useState<boolean>(
    candidateSelected || false,
  );

  return (
    <div
      key={candidate.id}
      className="flex flex-row gap-2 items-center text-sm"
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => {
          setIsSelected(checked as boolean);
          selectActionHandler(checked as boolean, candidate);
        }}
        id={candidate.id}
      />
      <Label htmlFor={candidate.id}>{candidate.name}</Label>
    </div>
  );
}
