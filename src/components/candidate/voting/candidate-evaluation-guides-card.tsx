"use client";

import { FileText, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClassificationText } from "@/components/candidates/candidate-text";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { getInitials } from "@/lib/utils";
import type { User } from "@/lib/db";

interface CandidateEvaluationGuidesCardProps {
  hasInterview: boolean;
  hasDynamic: boolean;
  interviewClassification?: string | null;
  dynamicClassification?: string | null;
  interviewers: User[];
  dynamicFacilitators: User[];
  onOpenInterview: () => void;
  onOpenDynamic: () => void;
}

export function CandidateEvaluationGuidesCard({
  hasInterview,
  hasDynamic,
  interviewClassification,
  dynamicClassification,
  interviewers,
  dynamicFacilitators,
  onOpenInterview,
  onOpenDynamic,
}: CandidateEvaluationGuidesCardProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        <span>Guias de Avaliação</span>
      </div>

      <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 shadow-xs text-xs">
        {/* Entrevista */}
        <div className="p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground">Entrevista</span>
              <ClassificationText level={interviewClassification} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-medium px-2.5 gap-1.5"
              disabled={!hasInterview}
              onClick={onOpenInterview}
            >
              <span>Ver guião</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            {interviewers.length > 0 ? (
              <>
                <div className="flex -space-x-1.5 shrink-0 overflow-hidden">
                  {interviewers.slice(0, 3).map((u) => (
                    <Avatar
                      key={u.id}
                      className="size-5 ring-1.5 ring-background"
                    >
                      <AvatarImage
                        src={getStableImageUrl(u.image)}
                        alt={u.name ?? ""}
                      />
                      <AvatarFallback className="text-[9px]">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {interviewers.length > 3 && (
                    <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-medium ring-1.5 ring-background">
                      +{interviewers.length - 3}
                    </div>
                  )}
                </div>
                <span
                  className="truncate text-xs text-muted-foreground font-medium"
                  title={interviewers.map((u) => u.name).join(", ")}
                >
                  {interviewers.map((u) => u.name).join(", ")}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                Sem entrevistadores atribuídos
              </span>
            )}
          </div>
        </div>

        {/* Dinâmica */}
        <div className="p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground">Dinâmica</span>
              <ClassificationText level={dynamicClassification} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-medium px-2.5 gap-1.5"
              disabled={!hasDynamic}
              onClick={onOpenDynamic}
            >
              <span>Ver guião</span>
            </Button>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            {dynamicFacilitators.length > 0 ? (
              <>
                <div className="flex -space-x-1.5 shrink-0 overflow-hidden">
                  {dynamicFacilitators.slice(0, 3).map((u) => (
                    <Avatar
                      key={u.id}
                      className="size-5 ring-1.5 ring-background"
                    >
                      <AvatarImage
                        src={getStableImageUrl(u.image)}
                        alt={u.name ?? ""}
                      />
                      <AvatarFallback className="text-[9px]">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {dynamicFacilitators.length > 3 && (
                    <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-medium ring-1.5 ring-background">
                      +{dynamicFacilitators.length - 3}
                    </div>
                  )}
                </div>
                <span
                  className="truncate text-xs text-muted-foreground font-medium"
                  title={dynamicFacilitators.map((u) => u.name).join(", ")}
                >
                  {dynamicFacilitators.map((u) => u.name).join(", ")}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                Sem facilitadores atribuídos
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
