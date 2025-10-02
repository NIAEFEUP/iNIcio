"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Calendar, Clock } from "lucide-react";
import { BookingSlotBox } from "./booking-slot-box";

export default function ChooseBookingSlot({
  dates,
  tableRef,
  timeSlots,
  getSlotForCell,
  getCellKey,
  selectedSlot,
  getTypeColor,
  formatDateHeader,
  bookings,
}) {
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
                    const existingSlot = getSlotForCell(date, time, bookings);
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
                      >
                        <BookingSlotBox
                          bookings={bookings}
                          existingSlot={existingSlot}
                          isSlotSelected={isSlotSelected}
                          getTypeColor={getTypeColor}
                        />
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
