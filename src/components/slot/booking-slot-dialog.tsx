"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingPicker, CandidateWithMeta } from "./booking-picker";
import { SlotType } from "../admin/slot-admin-calendar";
import type {
  Dynamic,
  Interview,
  RecruiterToCandidate,
  Slot,
  User,
} from "@/lib/db";

interface BookingSlotDialogProps {
  booking: (Interview | Dynamic) & {
    id: number;
    recruitmentId?: number;
    recruiters: Array<
      RecruiterToCandidate & {
        recruiter?: {
          user?: User;
          knownCandidates?: Array<{ candidateId: string }>;
          interviews?: any[];
          dynamics?: any[];
        };
      }
    >;
    slot?: Slot;
    candidate?: {
      user?: User;
      interviewClassification?: string | null;
      dynamicClassification?: string | null;
    };
    candidates?: Array<{
      userId?: string;
      candidate?: {
        user?: User;
        interviewClassification?: string | null;
        dynamicClassification?: string | null;
      };
    }>;
  };
  slotType: SlotType;
  existingSlot?: any;
  trigger?: React.ReactElement;
  children?: React.ReactNode;
}

export default function BookingSlotDialog({
  booking,
  slotType,
  existingSlot,
  trigger,
  children,
}: BookingSlotDialogProps) {
  const [open, setOpen] = useState<boolean>(false);

  const candidates = useMemo<CandidateWithMeta[]>(() => {
    if ("candidate" in booking && booking.candidate?.user) {
      return [
        {
          ...booking.candidate.user,
          interviewClassification: booking.candidate.interviewClassification,
          dynamicClassification: booking.candidate.dynamicClassification,
        },
      ];
    }

    if ("candidates" in booking && Array.isArray(booking.candidates)) {
      return booking.candidates
        .map((c: any) => {
          const userObj = c.candidate?.user || c.user;
          if (!userObj) return null;
          return {
            ...userObj,
            interviewClassification: c.candidate?.interviewClassification,
            dynamicClassification: c.candidate?.dynamicClassification,
          };
        })
        .filter(Boolean) as CandidateWithMeta[];
    }

    return [];
  }, [booking]);

  const startDate = useMemo(() => {
    const raw =
      booking.slot?.start ||
      existingSlot?.slot?.start ||
      existingSlot?.start ||
      new Date();
    return new Date(raw);
  }, [booking.slot?.start, existingSlot]);

  const duration =
    booking.slot?.duration ||
    existingSlot?.slot?.duration ||
    existingSlot?.duration ||
    30;

  const endDate = useMemo(
    () => new Date(startDate.getTime() + duration * 60 * 1000),
    [startDate, duration],
  );

  const formattedDate = useMemo(() => {
    const dayStr = format(startDate, "EEE, d 'de' MMM", { locale: pt });
    return dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
  }, [startDate]);

  const formattedTimeRange = `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;

  const sessionTypeLabel =
    slotType === SlotType.interview ? "Entrevista" : "Dinâmica";

  const candidateLabel =
    candidates.length === 1
      ? candidates[0].name
      : `${candidates.length} candidatos`;

  const getCardTitle = (): string => {
    if (candidates.length === 1) {
      return candidates[0].name;
    }
    return `Dinâmica #${booking.id}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className="w-full inline-block cursor-pointer"
        >
          {trigger}
        </div>
      ) : children ? (
        <span
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          className="cursor-pointer"
        >
          {children}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center justify-between gap-1 text-xs font-medium hover:underline cursor-pointer text-left w-full"
        >
          {getCardTitle()}
        </button>
      )}

      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atribuição de Recrutadores</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {sessionTypeLabel} · {candidateLabel} · {formattedDate},{" "}
            {formattedTimeRange} ({duration} min)
          </DialogDescription>
        </DialogHeader>

        <BookingPicker
          type={slotType}
          booking={booking as any}
          candidates={candidates}
          start={startDate}
          duration={duration}
          recruitmentId={booking.slot?.recruitmentId}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
