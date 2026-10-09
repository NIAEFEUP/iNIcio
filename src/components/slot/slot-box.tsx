import { cn } from "@/lib/utils";

export default function SlotBox({
  existingSlot,
  getTypeColor,
  preview = null,
}) {
  return (
    <div
      className={cn(
        "w-full h-12 border-2 border-dashed border-gray-200 dark:border-muted-foreground/35 rounded cursor-pointer",
        "hover:border-gray-300 dark:hover:border-muted-foreground/60",
        existingSlot &&
          `${getTypeColor(existingSlot.type)} border-solid border-transparent text-white`,
        preview === "select" && "ring-2 ring-inset ring-emerald-400",
        preview === "deselect" && "ring-2 ring-inset ring-red-400 opacity-60",
        preview === "select" && !existingSlot && "bg-emerald-50",
      )}
    >
      {existingSlot && (
        <div className="h-full flex flex-col items-center justify-center text-xs relative">
          <span className="font-medium">{existingSlot.duration} min</span>
          <span className="opacity-80">×{existingSlot.quantity}</span>
        </div>
      )}
    </div>
  );
}
