import { cn } from "@/lib/utils";
import { Clock, Users } from "lucide-react";

import BookingSlotDialog from "./booking-slot-dialog";

export function BookingSlotBox({
  slotType,
  existingSlot,
  isSlotSelected,
  getTypeColor,
  bookings,
}) {
  return (
    <>
      {existingSlot.map((booking) => (
        <div
          key={booking.id}
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
          <div className="h-full flex flex-col p-2 gap-1.5" key={booking.id}>
            <div className="flex items-center justify-between text-xs text-white/90">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="font-medium">
                  {existingSlot?.slot?.duration}m
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{bookings?.length}</span>
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

            {isSlotSelected && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
