"use client";

import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import { cn } from "@/lib/utils";

export interface CandidateAvatarLightboxProps {
  picture?: string | null;
  name: string;
  initials: string;
  size?: "default" | "sm" | "md" | "lg" | "xl";
  className?: string;
  avatarClassName?: string;
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
  avatarClassName,
}: CandidateAvatarLightboxProps) {
  const [open, setOpen] = useState(false);
  const hasPicture = Boolean(picture);

  const isSmall = size === "sm";
  const isMedium = size === "md";
  const isLarge = size === "lg";
  const isXLarge = size === "xl";

  const avatarClasses = isSmall
    ? "size-8 ring-1 ring-border/60"
    : isMedium
      ? "size-10 ring-2 ring-border/60"
      : isLarge
        ? "size-20 ring-4 ring-muted/80 shadow-sm"
        : isXLarge
          ? "size-24 ring-4 ring-muted/80 shadow-md"
          : "size-14 ring-2 ring-border/60";

  const fallbackTextClass = isSmall
    ? "text-[10px]"
    : isMedium
      ? "text-xs font-bold"
      : isLarge
        ? "text-xl font-bold"
        : isXLarge
          ? "text-2xl font-bold"
          : "text-base font-bold";

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (hasPicture) {
            setOpen(true);
          }
        }}
        className={cn(
          hasPicture
            ? "cursor-pointer rounded-full outline-none transition-transform hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            : "cursor-default rounded-full outline-none",
          className,
        )}
        aria-label={hasPicture ? `Ver foto de ${name}` : undefined}
        tabIndex={hasPicture ? 0 : -1}
      >
        <Avatar
          className={cn(
            "shrink-0 transition-opacity",
            hasPicture && "hover:opacity-95",
            avatarClasses,
            avatarClassName,
          )}
        >
          {hasPicture && (
            <AvatarImage
              src={picture ?? undefined}
              alt={name}
              className="object-cover"
            />
          )}
          <AvatarFallback>
            <InitialsAvatar
              className={cn(
                "size-full rounded-full font-bold",
                fallbackTextClass,
              )}
              initials={initials}
            />
          </AvatarFallback>
        </Avatar>
      </button>

      {open && hasPicture && (
        <Dialog open onOpenChange={setOpen}>
          <DialogContent className="w-fit max-w-[min(90vw,28rem)] bg-transparent p-2 ring-0 sm:max-w-none">
            <DialogTitle className="sr-only">Foto de {name}</DialogTitle>
            <Avatar className="size-64 sm:size-80 shrink-0">
              <AvatarImage
                src={picture ?? undefined}
                alt={name}
                className="object-cover"
              />
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

export const AvatarLightbox = CandidateAvatarLightbox;
