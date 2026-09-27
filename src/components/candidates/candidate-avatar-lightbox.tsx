"use client";

import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import { cn } from "@/lib/utils";

interface CandidateAvatarLightboxProps {
  picture?: string;
  name: string;
  initials: string;
  size?: "default" | "sm";
  className?: string;
}

/**
 * Avatar that opens the full-size picture in a dialog. The dialog only mounts
 * after the first click, so grids with many candidates do not pay for a dialog
 * instance per card.
 */
export function CandidateAvatarLightbox({
  picture,
  name,
  initials,
  size = "default",
  className,
}: CandidateAvatarLightboxProps) {
  const [open, setOpen] = useState(false);
  const isSmall = size === "sm";

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "cursor-pointer rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
        aria-label={`Ver foto de ${name}`}
      >
        <Avatar
          size={isSmall ? "sm" : undefined}
          className={cn(
            "shrink-0",
            isSmall ? "ring-1 ring-border/60" : "size-14 ring-2 ring-border/60",
          )}
        >
          <AvatarImage src={picture} alt={name} className="object-cover" />
          <AvatarFallback>
            <InitialsAvatar
              className={cn(
                "size-full rounded-full font-bold",
                isSmall ? "text-[10px]" : "text-base",
              )}
              initials={initials}
            />
          </AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <Dialog open onOpenChange={setOpen}>
          <DialogContent className="w-fit max-w-[min(90vw,28rem)] bg-transparent p-2 ring-0 sm:max-w-none">
            <DialogTitle className="sr-only">Foto de {name}</DialogTitle>
            <Avatar className="size-64 sm:size-80 shrink-0">
              <AvatarImage src={picture} alt={name} className="object-cover" />
              <AvatarFallback>
                <InitialsAvatar
                  className="size-full rounded-full text-4xl font-bold"
                  initials={initials}
                />
              </AvatarFallback>
            </Avatar>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
