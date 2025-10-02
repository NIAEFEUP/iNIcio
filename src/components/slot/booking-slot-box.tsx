import { cn } from "@/lib/utils";
import { Clock, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookingPicker } from "./booking-picker";
import { Candidate, Dynamic, Interview, User } from "@/lib/db";

export function BookingSlotBox({
  existingSlot,
  isSlotSelected,
  getTypeColor,
  bookings,
}) {
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
          user: User;
        }>;
      }
    ).candidates.map((c) => c.user);
  };

  return (
    <div
      className={cn(
        "w-full border-2 border-dashed border-gray-200 rounded cursor-pointer",
        "hover:border-gray-300",
        existingSlot &&
          !isSlotSelected &&
          `${getTypeColor(existingSlot.type)} border-solid border-transparent text-white`,
        isSlotSelected &&
          `${getTypeColor(existingSlot.type)} border-solid border-yellow-400 border-4 text-white shadow-lg ring-2 ring-yellow-200`,
      )}
    >
      {existingSlot && (
        <div className="h-full flex flex-col p-2 gap-1.5">
          <div className="flex items-center justify-between text-xs text-white/90">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="font-medium">{existingSlot.slot.duration}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{bookings?.length}</span>
            </div>
          </div>

          <div className="space-y-1 flex-1">
            {bookings.map((booking) => {
              return (
                <div
                  key={booking.id}
                  className="bg-white/10 backdrop-blur-sm rounded p-1.5 space-y-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Dialog>
                    <DialogTrigger className="flex items-center justify-between gap-1">
                      {booking.candidate.user.name}
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1 py-0 h-4 bg-white/20 shrink-0"
                      >
                        {booking.status}
                      </Badge>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle>Atribuição de recrutadores</DialogTitle>
                      <BookingPicker
                        booking={booking}
                        candidates={getCandidates(booking)}
                        start={existingSlot.slot.start}
                        duration={existingSlot.slot.duration}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })}
          </div>

          {isSlotSelected && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          )}
        </div>
      )}
    </div>
  );
}
