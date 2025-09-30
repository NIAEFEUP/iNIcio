import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { useState } from "react";

export default function ChooseCustomSlot({
  slots,
  dates,
  tableRef,
  timeSlots,
  getSlotForCell,
  getCellKey,
  selectedSlot,
  handleCellClick,
  getTypeColor,
  formatDateHeader,
}) {
  const [dragging, setDragging] = useState<boolean>(false);

  const onMouseUp = () => {
    setDragging(false);
  };

  const onMouseDown = (date, time) => {
    handleCellClick(date, time);
    setDragging(true);
  };

  const onMouseEnter = (date, time) => {
    if (dragging) handleCellClick(date, time);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full border-collapse select-none">
            <thead>
              <tr>
                <th className="text-left p-3 border-b font-medium text-muted-foreground min-w-[100px]">
                  Time
                </th>
                {dates.map((date) => {
                  const dateInfo = formatDateHeader(date);
                  return (
                    <th
                      key={date.toISOString()}
                      className="text-center p-3 border-b font-medium min-w-[120px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm text-muted-foreground">
                          {dateInfo.dayName}
                        </span>
                        <span className="text-lg font-semibold">
                          {dateInfo.dayNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {dateInfo.month}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time: string) => (
                <tr key={crypto.randomUUID()} className="border-b">
                  <td className="p-3 font-medium text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {time}
                    </div>
                  </td>
                  {dates.map((date: Date) => {
                    const cellKey = getCellKey(date, time);
                    const existingSlot = getSlotForCell(date, time, slots);
                    const isSlotSelected =
                      selectedSlot &&
                      existingSlot &&
                      selectedSlot === existingSlot;

                    return (
                      <td
                        key={
                          cellKey
                            ? cellKey.toLocaleString()
                            : crypto.randomUUID()
                        }
                        className="p-1"
                        onMouseUp={() => onMouseUp()}
                        onMouseDown={() => onMouseDown(date, time)}
                        onMouseEnter={() => onMouseEnter(date, time)}
                      >
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
                              <span className="font-medium">
                                {existingSlot.duration}m
                              </span>
                              <span className="opacity-80">
                                ×{existingSlot.quantity}
                              </span>
                              {isSlotSelected && (
                                <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-300 rounded-full"></div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
