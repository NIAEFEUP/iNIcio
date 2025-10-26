import { CandidateWithMetadata } from "@/lib/candidate";
import { Building2, Calendar } from "lucide-react";

interface CandidateAcademicInfoProps {
  candidate: CandidateWithMetadata;
}

export default function CandidateAcademicInfo({
  candidate,
}: CandidateAcademicInfoProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors duration-200">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Curso
            </p>
            <p className="text-sm font-bold text-foreground truncate">
              {candidate?.application?.degree || "mesw"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors duration-200">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ano
            </p>
            <p className="text-sm font-bold text-foreground truncate">
              {candidate?.application?.curricularYear || "3bsc"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
