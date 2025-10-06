import {
  Candidate,
  Dynamic,
  Interview,
  RecruiterToCandidate,
  User,
} from "@/lib/db";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookingPicker } from "./booking-picker";
import { SlotType } from "../admin/slot-admin-calendar";
import { useState } from "react";

interface BookingSlotDialogProps {
  booking:
    | (Interview & { recruiters: RecruiterToCandidate[] })
    | (Dynamic & {
        recruiters: RecruiterToCandidate[];
        candidates: Candidate[];
      });
  slotType: SlotType;
  existingSlot: any;
}

export default function BookingSlotDialog({
  booking,
  slotType,
  existingSlot,
}: BookingSlotDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [selectedRecruiters, setSelectedRecruiters] = useState<User[]>(
    booking.recruiters.map(
      (r) => (r as unknown as { recruiter: { user: User } }).recruiter.user,
    ),
  );
  const getCandidates = (
    booking: Interview | (Dynamic & { candidates: Candidate[] }),
  ): User[] => {
    if ("candidate" in booking) {
      return [(booking.candidate as { user: User }).user];
    }

    return (
      booking as Dynamic & {
        candidates: Array<{
          userId: string;
          candidate: { user: User };
        }>;
      }
    ).candidates.map((c) => c.candidate.user);
  };

  const getCardTitle = (
    booking: Interview | (Dynamic & { candidates: Candidate[] }),
  ): string => {
    if ("candidate" in booking) {
      return (booking.candidate as { user: User }).user.name;
    }

    return `Dinâmica #${
      (
        booking as Dynamic & {
          candidates: Array<{
            userId: string;
            user: User;
          }>;
        }
      ).id
    }`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center justify-between gap-1">
        {getCardTitle(booking)}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Atribuição de recrutadores</DialogTitle>
        <BookingPicker
          type={slotType}
          booking={booking}
          candidates={getCandidates(booking)}
          start={existingSlot?.slot?.start}
          duration={existingSlot?.slot?.duration}
          selectedRecruiters={selectedRecruiters}
          setSelectedRecruiters={setSelectedRecruiters}
        />
      </DialogContent>
    </Dialog>
  );
}
