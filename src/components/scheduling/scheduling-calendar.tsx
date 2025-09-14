"use client";

import { Slot } from "@/lib/db";
import { Calendar, Clock } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";

import { CheckCircle } from "lucide-react";
import { getDateString, getTimeString } from "@/lib/date";

interface SchedulingCalendarProps {
  slots: Array<Slot>;
  multipleSlots?: boolean;
  confirmMessage?: string;
  confirmAction: () => Promise<boolean>;
}

export default function SchedulingCalendar({
  slots,
  multipleSlots = false,
  confirmAction,
  confirmMessage,
}: SchedulingCalendarProps) {
  const [selectedSlots, setSelectedSlots] = useState<Array<Slot>>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const getUniqueTimeSlots = () => {
    return [
      ...new Set(
        slots.map((slot) =>
          slot.start.toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        ),
      ),
    ].sort();
  };

  const getUniqueDates = () => {
    return [
      ...new Set(
        slots.map(
          (slot) =>
            `${slot.start.getFullYear()}-${slot.start.getMonth() + 1}-${slot.start.getDate()}`,
        ),
      ),
    ].sort();
  };

  const getSlotForDateTime = (date: string, time: string) => {
    return slots.find(
      (slot) =>
        getDateString(slot.start) === date &&
        getTimeString(slot.start) === time,
    );
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    return {
      dayName: date.toLocaleDateString("pt-PT", { weekday: "short" }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString("pt-PT", { month: "short" }),
    };
  };

  const handleSlotSelect = (slot: Slot) => {
    if (multipleSlots) {
      setSelectedSlots((prevSlots) => [...prevSlots, slot]);
    } else {
      setSelectedSlots([slot]);
    }
  };

  const isSlotSelected = (slot: Slot) => {
    return selectedSlots.filter((s) => s.id === slot.id).length > 0;
  };

  const handleConfirm = async () => {
    if (await confirmAction()) {
      setIsConfirmed(true);
    }
  };

  const timeSlots = getUniqueTimeSlots();
  const dates = getUniqueDates();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl flex flex-col gap-y-4">
      {!isConfirmed ? (
        <>
          {selectedSlots.length > 0 && !isConfirmed && (
            <Card className="p-4">
              <div className="flex flex-row items-center">
                <CardHeader className="w-full">
                  <CardTitle className="flex items-center gap-2">
                    Confirma a tua escolha
                  </CardTitle>
                </CardHeader>
                <Button onClick={handleConfirm}>Confirmar</Button>
              </div>
            </Card>
          )}

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Setembro</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-3 border-b font-medium text-muted-foreground min-w-[100px]">
                        Horas
                      </th>
                      {dates.map((date) => {
                        const dateInfo = formatDateHeader(date);
                        console.log("DATE INFO: ", dateInfo);
                        console.log("dates: ", dates);
                        return (
                          <th
                            key={date}
                            className="text-center p-3 border-b font-medium min-w-[120px]"
                          >
                            <div className="flex flex-col">
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
                    {timeSlots.map((time) => (
                      <tr key={time} className="border-b">
                        <td className="p-3 font-medium text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {time}
                          </div>
                        </td>
                        {dates.map((date) => {
                          const slot = getSlotForDateTime(date, time);

                          return (
                            <td key={`${date}-${time}`} className="p-2">
                              {slot && (
                                <Button
                                  key={slot.id}
                                  variant={
                                    isSlotSelected(slot) ? "default" : "outline"
                                  }
                                  size="sm"
                                  className={cn(
                                    "w-full h-auto p-2 text-xs hover:bg-gray-400",
                                    isSlotSelected(slot) ? "bg-gray-200" : "",
                                  )}
                                  onClick={() => handleSlotSelect(slot)}
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs text-muted-foreground">
                                      {slot.duration} min
                                    </span>
                                  </div>
                                </Button>
                              )}
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
        </>
      ) : (
        <Card className="mb-8 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  Confirmado!
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  {confirmMessage}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
