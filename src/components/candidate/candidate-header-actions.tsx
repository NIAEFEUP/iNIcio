import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CandidateHeaderActionsProps {
  candidateId?: string;
  currentPage: "candidate" | "interview" | "dynamic";
  dynamicId?: string | number | null;
  hasInterview?: boolean;
  mobile?: boolean;
}

export function CandidateHeaderActions({
  candidateId,
  currentPage,
  dynamicId,
  hasInterview,
  mobile,
}: CandidateHeaderActionsProps) {
  if (mobile) {
    return (
      <div className="flex w-full flex-col gap-2 md:hidden">
        {currentPage !== "dynamic" && dynamicId && (
          <Button
            nativeButton={false}
            variant="secondary"
            className="w-full justify-start"
            render={<Link href={`/dynamic/${dynamicId}`} target="_blank" />}
          >
            <ExternalLink className="mr-2 size-4" />
            Dinâmica
          </Button>
        )}

        {currentPage !== "interview" && candidateId && hasInterview && (
          <Button
            nativeButton={false}
            variant="secondary"
            className="w-full justify-start"
            render={
              <Link
                href={`/candidate/${candidateId}/interview`}
                target="_blank"
              />
            }
          >
            <ExternalLink className="mr-2 size-4" />
            Entrevista
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      {currentPage !== "dynamic" && dynamicId && (
        <Button
          nativeButton={false}
          variant="secondary"
          size="sm"
          render={<Link href={`/dynamic/${dynamicId}`} target="_blank" />}
        >
          <ExternalLink className="mr-1.5 size-4" />
          Dinâmica
        </Button>
      )}

      {currentPage !== "interview" && candidateId && hasInterview && (
        <Button
          nativeButton={false}
          variant="secondary"
          size="sm"
          render={
            <Link
              href={`/candidate/${candidateId}/interview`}
              target="_blank"
            />
          }
        >
          <ExternalLink className="mr-1.5 size-4" />
          Entrevista
        </Button>
      )}
    </div>
  );
}
