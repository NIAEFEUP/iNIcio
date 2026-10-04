"use client";

import * as React from "react";
import { History, User } from "lucide-react";
import { useSWRConfig } from "swr";
import { candidateKey } from "@/lib/hooks/candidates/use-candidate-data";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CandidateAvatarLightbox } from "@/components/candidates/candidate-avatar-lightbox";
import { getInitials, cn } from "@/lib/utils";
import { getStableImageUrl } from "@/lib/stable-image-url";
import type {
  CandidateListMetadata,
  CandidateWithMetadata,
} from "@/lib/candidate";
import type { RecruiterToCandidate } from "@/lib/db";

export interface CandidatePersonalInfoCardProps {
  candidate: CandidateWithMetadata | CandidateListMetadata;
  friends?: Array<RecruiterToCandidate>;
  authUser?: { id?: string; isAdmin?: boolean } | null;
  recruitmentId?: number | null;
  onToggleKnown?: (known: boolean) => void | Promise<void>;
  showKnownCheckbox?: boolean;
  className?: string;
}

function useSyncedState<S>(
  value: S,
): [S, React.Dispatch<React.SetStateAction<S>>] {
  const [state, setState] = React.useState(value);
  const [previous, setPrevious] = React.useState(value);
  if (!Object.is(previous, value)) {
    setPrevious(value);
    setState(value);
  }
  return [state, setState];
}

export function CandidatePersonalInfoCard({
  candidate,
  friends = [],
  authUser = null,
  recruitmentId,
  onToggleKnown,
  showKnownCheckbox = true,
  className,
}: CandidatePersonalInfoCardProps) {
  const { mutate } = useSWRConfig();
  const candidateFriends = candidate.knownRecruiters ?? friends;

  const isKnownInitially = candidateFriends.some(
    (friend) =>
      friend.candidateId === candidate.id &&
      friend.recruiterId === authUser?.id,
  );
  const [known, setKnown] = useSyncedState<boolean>(isKnownInitially);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const toggleKnown = async () => {
    const nextKnown = !known;
    setKnown(nextKnown);
    setIsUpdating(true);

    if (onToggleKnown) {
      try {
        await onToggleKnown(nextKnown);
      } catch (err) {
        console.error(err);
        setKnown(!nextKnown);
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    try {
      const response = await fetch("/api/friends", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate.id,
          recruitmentId: recruitmentId ?? undefined,
        }),
      });
      if (!response.ok) {
        setKnown(!nextKnown);
        return;
      }

      const data = await response.json().catch(() => null);
      if (data && typeof data.known === "boolean") {
        setKnown(data.known);
      }

      mutate(candidateKey(candidate.id, recruitmentId));
    } catch (err) {
      console.error(err);
      setKnown(!nextKnown);
    } finally {
      setIsUpdating(false);
    }
  };

  const picture = getStableImageUrl(candidate.image);
  const name = candidate.name || "Candidato";
  const initials = React.useMemo(
    () => getInitials(candidate.name),
    [candidate.name],
  );
  const studentNumber = candidate.application?.studentNumber;
  const previousApplicationYears = candidate.previousApplicationYears ?? [];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <CandidateAvatarLightbox
              picture={picture}
              name={name}
              initials={initials}
              size="lg"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <h2
                className="text-base font-bold text-foreground truncate"
                title={name}
              >
                {name}
              </h2>
              {previousApplicationYears.length > 0 && (
                <Tooltip>
                  <TooltipTrigger
                    className="-ml-0.5 inline-flex shrink-0 cursor-help items-center text-muted-foreground"
                    aria-label={`Candidatou-se anteriormente em ${previousApplicationYears.join(", ")}`}
                  >
                    <History className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Candidatou-se anteriormente em{" "}
                    {previousApplicationYears.join(", ")}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <p className="text-xs font-mono text-muted-foreground">
              {studentNumber ? `${studentNumber}` : "Sem número de estudante"}
            </p>

            {showKnownCheckbox && !authUser?.isAdmin && (
              <div className="pt-1.5">
                <label
                  htmlFor={`knows-candidate-${candidate.id}`}
                  className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Checkbox
                    id={`knows-candidate-${candidate.id}`}
                    checked={known}
                    disabled={isUpdating}
                    onCheckedChange={toggleKnown}
                    className="size-4"
                  />
                  <span>Conheço o candidato</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidatePersonalInfoCard;
