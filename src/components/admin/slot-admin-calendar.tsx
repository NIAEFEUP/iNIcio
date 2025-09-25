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
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Slot } from "@/lib/db";
import { Checkbox } from "../ui/checkbox";

interface SlotAdminCalendarProps {
  recruitmentYear: number;
  existingSlots?: {
    interview: Slot[];
    dynamic: Slot[];
  };
  saveSlots: (slots: Slot[]) => Promise<void>;
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

  const [selectedCells, setSelectedCells] = useState<Array<string>>([]);

  const [slotConfig, setSlotConfig] = useState({
    duration: 30,
    quantity: 1,
  });

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const tableRef = useRef<HTMLTableElement>(null);

  const generateSlotsForDate = (date: Date) => {
    const slots = [];

    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push({
          start: new Date(date),
          duration: slotConfig.duration,
          quantity: slotConfig.quantity,
          type: slotType,
          recruitmentYear: recruitmentYear,
        });
      }
    }

    console.log("slots: ", slots);

    return slots;
  };

  // Generate time slots (9 AM to 6 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const times = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        times.push(timeString);
      }
    }
    return times;
  };

  // Generate dates for the next 14 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
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
    setIsSelecting(false);

    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);

    // 2️⃣ Compute end datetime based on duration
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + slotConfig.duration);

    setSlots((prev) => {
      // Get current slots of this type
      const currentSlots = prev[slotType];

      // 3️⃣ Check if a slot already exists with same start & end
      const existingIndex = currentSlots.findIndex(
        (slot) =>
          slot.start.getTime() === start.getTime() &&
          slot.start.getTime() + slot.duration * 60000 === end.getTime(),
      );

      if (existingIndex !== -1) {
        slots[slotType] = currentSlots.filter((_, i) => i != existingIndex);

        setSlots(slots);
      } else {
        const newSlot: Slot = {
          start,
          duration: slotConfig.duration,
          quantity: slotConfig.quantity,
          type: slotType as Slot["type"],
          recruitmentYear,
        };
        return { ...prev, [slotType]: [...currentSlots, newSlot] };
      }
    });

    setIsSelecting(true);
  };

  console.log("slots: ", slots);

  console.log("selected cells: ", selectedCells);

  const handleSaveSlots = async () => {
    try {
      saveSlots(slots[slotType]);
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

  const handleCheckboxChange = (date: Date, checked: boolean) => {
    if (checked) {
      setSlots((prev) => {
        return {
          ...prev,
          [slotType]: [...prev[slotType], ...generateSlotsForDate(date)],
        };
      });
    } else {
      setSlots((prev) => {
        return {
          ...prev,
          [slotType]: prev[slotType].filter(
            (slot) => slot.start.getTime() !== date.getTime(),
          ),
        };
      });
    }
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Slot Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={slotConfig.duration}
                onChange={(e) =>
                  setSlotConfig((prev) => ({
                    ...prev,
                    duration: Number.parseInt(e.target.value) || 30,
                  }))
                }
                min="15"
                max="120"
                step="15"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={slotConfig.quantity}
                onChange={(e) =>
                  setSlotConfig((prev) => ({
                    ...prev,
                    quantity: Number.parseInt(e.target.value) || 1,
                  }))
                }
                min="1"
                max="10"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
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
          <p className="text-sm text-muted-foreground">
            Clica e arrasta para criar slots. Clica em slots existentes para
            remover.
          </p>
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
                          <Checkbox
                            key={date.getDay()}
                            onCheckedChange={(checked: boolean) =>
                              handleCheckboxChange(date, checked)
                            }
                          />
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
                      const isSelected = false; //selectedCells?.includes(cellKey)
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
                              isSelected &&
                                "border-blue-400 bg-blue-100 border-solid",
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Slots</p>
                <p className="text-2xl font-bold">{slots[slotType].length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold">
                  {slots[slotType].reduce(
                    (sum, slot) => sum + slot.quantity,
                    0,
                  )}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Recruitment Year
                </p>
                <p className="text-2xl font-bold">{recruitmentYear}</p>
              </div>
              <Badge variant="outline">{recruitmentYear}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
