"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { getInitials } from "@/lib/utils";
import type { User } from "@/lib/db";

interface RecruiterAssignedProps {
  interviewers: Array<User>;
  title?: string;
}

export default function RecruiterAssignedInfo({
  interviewers,
  title = "Entrevistadores",
}: RecruiterAssignedProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <h3 className="mb-3 text-xs font-semibold text-muted-foreground">
        {title}
      </h3>
      {interviewers?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum entrevistador atribuído.
        </p>
      )}
      <div className="flex flex-col divide-y divide-border">
        {interviewers?.map((interviewer) => (
          <div
            key={interviewer.id}
            className="flex items-center gap-2 py-1.5 first:pt-0 last:pb-0"
          >
            <Avatar size="sm">
              <AvatarImage
                src={getStableImageUrl(interviewer.image) || undefined}
                alt={interviewer.name || "Entrevistador"}
              />
              <AvatarFallback>
                <InitialsAvatar
                  className="size-full rounded-full text-[10px] font-bold"
                  initials={getInitials(interviewer.name)}
                />
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium truncate">
              {interviewer.name
                ? interviewer.name.split(" ").length > 2
                  ? `${interviewer.name.split(" ")[0]} ${interviewer.name.split(" ").slice(-1)}`
                  : interviewer.name
                : "Entrevistador"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
