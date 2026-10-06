"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingPicker, CandidateWithMeta } from "./booking-picker";
import ReallocationSlotPicker from "./reallocation-slot-picker";
import {
  adminReallocateDynamic,
  adminReallocateInterview,
  getReallocationSlotOptions,
} from "@/app/actions";
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
  const [moveCandidateId, setMoveCandidateId] = useState<string | null>(null);
  const [slotOptions, setSlotOptions] = useState<{
    interview: Slot[];
    dynamic: Slot[];
  } | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isInterview = slotType === SlotType.interview;
  const candidateId = booking.candidate?.user?.id;

  useEffect(() => {
    if (moveCandidateId && slotOptions === null) {
      getReallocationSlotOptions().then(setSlotOptions);
    }
  }, [moveCandidateId, slotOptions]);

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

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setMoveCandidateId(null);
      setSelectedSlotId(null);
      setSlotOptions(null);
    }
  };

  const handleToggleMove = (targetCandidateId: string) => {
    setMoveCandidateId(
      moveCandidateId === targetCandidateId ? null : targetCandidateId,
    );
    setSelectedSlotId(null);
  };

  const handleConfirmMove = () => {
    if (!moveCandidateId || !selectedSlotId) return;

    startTransition(async () => {
      try {
        if (isInterview) {
          await adminReallocateInterview(moveCandidateId, selectedSlotId);
        } else {
          await adminReallocateDynamic(moveCandidateId, selectedSlotId);
        }

        toast.add({
          type: "success",
          title: isInterview
            ? "Entrevista realocada com sucesso!"
            : "Candidato realocado com sucesso!",
        });
        handleOpenChange(false);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : isInterview
              ? "Ocorreu um erro ao realocar a entrevista."
              : "Ocorreu um erro ao realocar o candidato.";
        toast.add({ type: "error", title: message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        {(isInterview ? candidateId : candidates.length > 0) && (
          <div className="pt-3 border-t border-border/50 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">
                  {isInterview
                    ? "Realocação de horário"
                    : "Realocação de candidato"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isInterview
                    ? "Os entrevistadores podem ser removidos se não estiverem disponíveis no novo horário."
                    : "Move um candidato desta sessão para outra sessão disponível."}
                </p>
              </div>
              {isInterview && candidateId && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleMove(candidateId)}
                  disabled={isPending}
                  className="shrink-0 text-xs cursor-pointer"
                >
                  {moveCandidateId === candidateId ? "Cancelar" : "Mover"}
                </Button>
              )}
            </div>

            {candidateId ? (
              moveCandidateId === candidateId && (
                <>
                  <ReallocationSlotPicker
                    type={slotType}
                    slots={isInterview ? (slotOptions?.interview ?? []) : []}
                    currentSlotId={booking.slot?.id}
                    selectedSlotId={selectedSlotId}
                    pending={isPending || slotOptions === null}
                    onSelect={setSelectedSlotId}
                  />

                  <div className="flex items-center justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleConfirmMove}
                      disabled={!selectedSlotId || isPending}
                      className="text-xs font-medium cursor-pointer"
                    >
                      {isPending && (
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      )}
                      Confirmar realocação
                    </Button>
                  </div>
                </>
              )
            ) : (
              <div className="space-y-2">
                {candidates.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2"
                  >
                    <span className="truncate text-xs font-medium text-foreground">
                      {participant.name}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        moveCandidateId === participant.id
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() => handleToggleMove(participant.id)}
                      disabled={isPending}
                      className="shrink-0 text-xs cursor-pointer"
                    >
                      {moveCandidateId === participant.id
                        ? "Cancelar"
                        : "Mover"}
                    </Button>
                  </div>
                ))}

                {moveCandidateId && (
                  <>
                    <ReallocationSlotPicker
                      type="dynamic"
                      slots={slotOptions?.dynamic ?? []}
                      currentSlotId={booking.slot?.id}
                      selectedSlotId={selectedSlotId}
                      pending={isPending || slotOptions === null}
                      onSelect={setSelectedSlotId}
                    />

                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleConfirmMove}
                        disabled={!selectedSlotId || isPending}
                        className="text-xs font-medium cursor-pointer"
                      >
                        {isPending && (
                          <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        )}
                        Confirmar realocação
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
