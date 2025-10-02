import { cn } from "@/lib/utils";

export default function SlotBox({
  existingSlot,
  isSlotSelected,
  getTypeColor,
  handleCellClick,
  date,
  time,
}) {
  return (
    <div
      className={cn(
        "w-full h-12 border-2 border-dashed border-gray-200 rounded cursor-pointer",
        "hover:border-gray-300",
        existingSlot &&
          !isSlotSelected &&
          `${getTypeColor(existingSlot.type)} border-solid border-transparent text-white`,
        isSlotSelected &&
          `${getTypeColor(existingSlot.type)} border-solid border-yellow-400 border-4 text-white shadow-lg ring-2 ring-yellow-200`,
      )}
      onClick={() => handleCellClick(date, time)}
    >
      {existingSlot && (
        <div className="h-full flex flex-col items-center justify-center text-xs relative">
          <span className="font-medium">{existingSlot.duration}m</span>
          <span className="opacity-80">×{existingSlot.quantity}</span>
          {isSlotSelected && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-300 rounded-full"></div>
          )}
        </div>
      )}
    </div>
  );
}
