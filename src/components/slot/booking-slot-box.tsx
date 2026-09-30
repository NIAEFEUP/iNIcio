import { cn } from "@/lib/utils";
import { Clock, Users } from "lucide-react";

import BookingSlotDialog from "./booking-slot-dialog";

export function BookingSlotBox({ slotType, existingSlot, getTypeColor }) {
  return (
    <>
      {existingSlot.map((booking) => (
        <div
          key={booking.id}
          className={cn(
            "w-full border-2 border-dashed border-gray-200 dark:border-muted-foreground/35 rounded cursor-pointer",
            "hover:border-gray-300 dark:hover:border-muted-foreground/60",
            `${getTypeColor(booking.slot.type)} border-solid border-transparent text-white`,
          )}
        >
          <div className="h-full flex flex-col p-2 gap-1.5" key={booking.id}>
            <div className="flex items-center justify-between text-xs text-white/90">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="font-medium">{booking.slot.duration} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{booking.candidates?.length ?? existingSlot.length}</span>
              </div>
            </div>

            <div className="space-y-1 flex-1">
              <div
                className="bg-white/10 backdrop-blur-sm rounded p-1.5 space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                <BookingSlotDialog
                  booking={booking}
                  slotType={slotType}
                  existingSlot={booking}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
