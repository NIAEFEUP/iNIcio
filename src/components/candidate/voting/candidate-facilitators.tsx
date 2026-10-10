"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { getInitials } from "@/lib/utils";
import type { User } from "@/lib/db";

/** Compact avatars + names for the recruiters assigned to an interview/dynamic. */
export function FacilitatorChips({
  users,
  emptyLabel,
}: {
  users: User[];
  emptyLabel?: string;
}) {
  if (users.length === 0) {
    return emptyLabel ? (
      <span className="text-[11px] text-muted-foreground">{emptyLabel}</span>
    ) : null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {users.map((user) => (
        <span
          key={user.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground"
        >
          <Avatar className="size-4">
            <AvatarImage
              src={getStableImageUrl(user.image)}
              alt={user.name ?? ""}
            />
            <AvatarFallback className="text-[8px]">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          {user.name}
        </span>
      ))}
    </div>
  );
}
