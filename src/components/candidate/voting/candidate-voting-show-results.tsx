import { Button } from "@/components/ui/button";
import { CandidateVotingContext } from "@/lib/contexts/CandidateVotingContext";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { useContext, useState } from "react";

export default function CandidateVotingShowResults() {
  const [show, setShow] = useState<boolean>(false);

  const { approvedCount, rejectedCount } = useContext(CandidateVotingContext);

  const total = approvedCount + rejectedCount;
  const approvedPercentage = total === 0 ? 0 : (approvedCount / total) * 100;
  const rejectedPercentage = total === 0 ? 0 : (rejectedCount / total) * 100;

  return (
    <div className="flex flex-col gap-2">
      {show && (
        <>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-secondary" />
                <span className="text-lg font-medium text-foreground">
                  {approvedCount}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">A favor</p>
                <p className="text-xs">{approvedPercentage}%</p>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1.5">
                <X className="h-4 w-4 text-destructive" />
                <span className="text-lg font-medium text-foreground">
                  {rejectedCount}
                </span>
              </div>
              <div>
                <p className="text-xs text-destructive/80">Contra</p>
                <p className="text-xs">{rejectedPercentage}%</p>
              </div>
            </div>
          </div>
        </>
      )}
      <Button
        onClick={() => {
          setShow((prev) => !prev);
        }}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
