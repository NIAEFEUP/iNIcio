"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { getInitials, cn } from "@/lib/utils";
import type { User } from "@/lib/db";

export interface RecruiterAssignedHeaderProps {
  interviewers: Array<User>;
  title?: string;
  className?: string;
}

function formatName(name: string | null | undefined, fallback: string): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length > 2) {
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }
  return name;
}

export function RecruiterAssignedHeader({
  interviewers,
  title = "Recrutadores",
  className,
}: RecruiterAssignedHeaderProps) {
  const singularTitle =
    title === "Entrevistadores"
      ? "Entrevistador"
      : title === "Recrutadores"
        ? "Recrutador"
        : title;

  if (!interviewers || interviewers.length === 0) {
    const emptyText =
      title === "Entrevistadores" ? "Sem entrevistadores" : "Sem recrutadores";

    return (
      <div
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-border/80 bg-muted/20 px-2.5 text-xs text-muted-foreground select-none",
          className,
        )}
      >
        <Users className="size-3.5 shrink-0 opacity-70" />
        <span>{emptyText}</span>
      </div>
    );
  }

  const displayTitle = interviewers.length === 1 ? singularTitle : title;
  const fallbackRole = singularTitle;

  const maxVisibleAvatars = interviewers.length <= 4 ? 4 : 3;
  const visibleInterviewers = interviewers.slice(0, maxVisibleAvatars);
  const remainingCount = interviewers.length - maxVisibleAvatars;

  const namesSummary =
    interviewers.length === 1
      ? formatName(interviewers[0].name, fallbackRole)
      : interviewers.length === 2
        ? `${formatName(interviewers[0].name, fallbackRole)}, ${formatName(interviewers[1].name, fallbackRole)}`
        : `${formatName(interviewers[0].name, fallbackRole)}, ${formatName(interviewers[1].name, fallbackRole)} +${interviewers.length - 2}`;

  return (
    <div
      className={cn(
        "flex h-8 items-center gap-2 rounded-lg border border-border/80 bg-card px-2.5 text-xs shadow-2xs",
        className,
      )}
    >
      <span className="text-muted-foreground font-medium hidden sm:inline">
        {displayTitle}:
      </span>

      <div className="flex items-center -space-x-1.5 py-0.5">
        {visibleInterviewers.map((interviewer) => (
          <Tooltip key={interviewer.id}>
            <TooltipTrigger
              render={<span className="inline-flex shrink-0 cursor-default" />}
            >
              <Avatar size="sm" className="size-6 ring-2 ring-card shrink-0">
                <AvatarImage
                  src={getStableImageUrl(interviewer.image) || undefined}
                  alt={interviewer.name || fallbackRole}
                />
                <AvatarFallback>
                  <InitialsAvatar
                    className="size-full rounded-full text-[10px] font-bold"
                    initials={getInitials(interviewer.name)}
                  />
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-medium">{interviewer.name || fallbackRole}</p>
              {interviewer.email && (
                <p className="text-[10px] text-muted-foreground">
                  {interviewer.email}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}

        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={<span className="inline-flex shrink-0 cursor-default" />}
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-card">
                +{remainingCount}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold text-xs mb-0.5">
                  Outros {displayTitle.toLowerCase()}:
                </p>
                {interviewers.slice(maxVisibleAvatars).map((interviewer) => (
                  <span key={interviewer.id} className="text-xs">
                    {interviewer.name || fallbackRole}
                  </span>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <span
        className="hidden sm:inline font-medium text-foreground max-w-[130px] md:max-w-[240px] truncate"
        title={interviewers.map((i) => i.name || fallbackRole).join(", ")}
      >
        {namesSummary}
      </span>
    </div>
  );
}

export default RecruiterAssignedHeader;
