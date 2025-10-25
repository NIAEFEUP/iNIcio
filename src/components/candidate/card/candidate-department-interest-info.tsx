import { Badge } from "@/components/ui/badge";
import { CandidateWithMetadata } from "@/lib/candidate";

interface CandidateDepartmentInterestInfoProps {
  candidate: CandidateWithMetadata;
}

export default function CandidateDepartmentInterestInfo({
  candidate,
}: CandidateDepartmentInterestInfoProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Departamentos
      </p>
      <div className="flex flex-wrap gap-2">
        {(candidate.application.interests?.length > 0
          ? candidate.application.interests
          : []
        ).map((interest, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="px-3 py-1.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium text-xs tracking-wide hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-default"
          >
            {interest}
          </Badge>
        ))}
      </div>
    </div>
  );
}
