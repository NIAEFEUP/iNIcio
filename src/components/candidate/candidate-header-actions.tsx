import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CandidateHeaderActionsProps {
  candidateId?: string;
  currentPage: "candidate" | "interview" | "dynamic";
  dynamicId?: string | number | null;
  hasInterview?: boolean;
  backHref?: string;
}

export function CandidateHeaderActions({
  candidateId,
  currentPage,
  dynamicId,
  hasInterview,
  backHref = "/candidates",
}: CandidateHeaderActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentPage !== "dynamic" && dynamicId && (
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/dynamic/${dynamicId}`} target="_blank" />}
        >
          <ExternalLink />
          Dinâmica
        </Button>
      )}

      {currentPage !== "interview" && candidateId && hasInterview && (
        <Button
          variant="outline"
          size="sm"
          render={
            <Link
              href={`/candidate/${candidateId}/interview`}
              target="_blank"
            />
          }
        >
          <ExternalLink />
          Entrevista
        </Button>
      )}

      <Button variant="ghost" size="sm" render={<Link href={backHref} />}>
        <ArrowLeft />
        Voltar
      </Button>
    </div>
  );
}
