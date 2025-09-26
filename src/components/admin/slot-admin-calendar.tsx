"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { NewSlot, Slot } from "@/lib/db";
import { SlotOperation } from "@/app/admin/interviews/page";

interface SlotAdminCalendarProps {
  recruitmentYear: number;
  existingSlots?: {
    interview: Slot[];
    dynamic: Slot[];
  };
  saveSlots: (slots: SlotOperation[]) => Promise<void>;
}

enum SlotType {
  interview = "interview",
  dynamic = "dynamic",
}

export default function SlotAdminCalendar({
  recruitmentYear,
  existingSlots = {
    interview: [],
    dynamic: [],
  },
  saveSlots,
}: SlotAdminCalendarProps) {
  const [slots, setSlots] = useState<{
    interview: Slot[];
    dynamic: Slot[];
  }>(existingSlots);

  const [slotType, setSlotType] = useState<SlotType>(SlotType.interview);

  const [slotOperations, setSlotOperations] = useState<SlotOperation[]>([]);

  const [slotConfig, setSlotConfig] = useState({
    interview: {
      startHour: 9,
      endHour: 19,
      duration: 30,
      quantity: 2,
    },
    dynamic: {
      startHour: 9,
      endHour: 19,
      duration: 45,
      quantity: 5,
    },
  });

  const [selectedSlot] = useState<Slot | null>(null);

  const tableRef = useRef<HTMLTableElement>(null);

  const generateTimeSlots = () => {
    const times = [];
    for (
      let hour = slotConfig[slotType].startHour;
      hour <= slotConfig[slotType].endHour;
      hour++
    ) {
      for (
        let minute = 0;
        minute < 60;
        minute += slotConfig[slotType].duration
      ) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const generateDates = () => {
    const dates = [];
    const start = new Date(2025, 9, 13); // Months are 0-indexed (9 = October)
    const end = new Date(2025, 9, 17);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    return dates;
  };

  const timeSlots = generateTimeSlots();
  const dates = generateDates();

  const getCellKey = (date: Date, time: string) => {
    const dateStr = date.toISOString().split("T")[0];
    return new Date(`${dateStr}T${time}:00`);
  };

  const getSlotForCell = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);

    return slots[slotType]?.find(
      (slot) => slot.start.getTime() === slotDateTime.getTime(),
    );
  };

  const handleCellClick = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);

    // 2️⃣ Compute end datetime based on duration
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + slotConfig[slotType].duration);

    const currentSlots = slots[slotType];

    // 3️⃣ Check if a slot already exists with same start & end
    const existingIndex = currentSlots.findIndex(
      (slot) =>
        slot.start.getTime() === start.getTime() &&
        slot.start.getTime() + slot.duration * 60000 === end.getTime(),
    );

    if (existingIndex !== -1) {
      slots[slotType] = currentSlots.filter((_, i) => i != existingIndex);

      setSlots(slots);
      setSlotOperations((prev) => [
        ...prev.filter(
          (s) =>
            !(
              s.type === "remove" &&
              s.slot.start.getTime() === start.getTime() &&
              s.slot.start.getTime() + s.slot.duration * 60000 === end.getTime()
            ),
        ),
        { type: "remove", slot: currentSlots[existingIndex] },
      ]);
    } else {
      const newSlot: NewSlot = {
        start,
        duration: slotConfig[slotType].duration,
        quantity: slotConfig[slotType].quantity,
        type: slotType,
        recruitmentYear,
      };

      setSlots({ ...slots, [slotType]: [...currentSlots, newSlot] });
      setSlotOperations((prev) => [
        ...prev.filter(
          (s) =>
            !(
              s.type === "remove" &&
              s.slot.start.getTime() === start.getTime() &&
              s.slot.start.getTime() + s.slot.duration * 60000 === end.getTime()
            ),
        ),
        { type: "add", slot: newSlot },
      ]);
    }
  };

  const handleSaveSlots = async () => {
    try {
      saveSlots(slotOperations);
      toast("Slots guardados");
    } catch (error) {
      toast("Erro ao guardar slots: " + error);
    }
  };

  const formatDateHeader = (date: Date) => {
    return {
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
    };
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "interview":
        return "bg-blue-500";
      case "dynamic":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={slotConfig[slotType].duration}
                onChange={(e) =>
                  setSlotConfig((prev) => ({
                    ...prev,
                    [slotType]: {
                      ...prev[slotType],
                      duration: Number.parseInt(e.target.value) || 30,
                    },
                  }))
                }
                min="15"
                max="120"
                step="15"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                value={slotConfig[slotType].quantity}
                onChange={(e) =>
                  setSlotConfig((prev) => ({
                    ...prev,
                    [slotType]: {
                      ...prev[slotType],
                      quantity: Number.parseInt(e.target.value) || 1,
                    },
                  }))
                }
                min="1"
                max="10"
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={slotType}
                onValueChange={(value: any) => setSlotType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="dynamic">Dynamic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSaveSlots} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Interview</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Dynamic</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table
              ref={tableRef}
              className="w-full border-collapse select-none"
            >
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
                {timeSlots.map((time) => (
                  <tr key={time} className="border-b">
                    <td className="p-3 font-medium text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {time}
                      </div>
                    </td>
                    {dates.map((date) => {
                      const cellKey = getCellKey(date, time);
                      const existingSlot = getSlotForCell(date, time);
                      const isSlotSelected =
                        selectedSlot &&
                        existingSlot &&
                        selectedSlot === existingSlot;

                      return (
                        <td key={cellKey.toLocaleString()} className="p-1">
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
    </div>
  );
}
