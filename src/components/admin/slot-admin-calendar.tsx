"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

import { Dynamic, Interview, NewSlot, Slot } from "@/lib/db";
import { SlotOperation } from "@/app/admin/interviews/page";
import ChooseCustomSlot from "../slot/choose-custom-slot";
import {
  formatDateHeader,
  generateDates,
  generateTimeSlots,
  getBookingForCell,
  getCellKey,
  getSlotForCell,
} from "@/lib/date";
import SlotConfigPanel from "../slot/slot-config-panel";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChooseBookingSlot from "../slot/choose-booking-slot";

interface SlotAdminCalendarProps {
  recruitmentYear: number;
  existingSlots?: {
    interview: Slot[];
    dynamic: Slot[];
  };
  bookings: {
    interview: Interview[];
    dynamic: Dynamic[];
  };
  saveSlots: (slots: SlotOperation[]) => Promise<void>;
}

export enum SlotType {
  interview = "interview",
  dynamic = "dynamic",
}

export default function SlotAdminCalendar({
  recruitmentYear,
  existingSlots = {
    interview: [],
    dynamic: [],
  },
  bookings,
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

  const timeSlots = generateTimeSlots(
    slotConfig[slotType].startHour,
    slotConfig[slotType].endHour,
    slotConfig[slotType].duration,
  );

  const dates = generateDates();

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

      slots[slotType] = currentSlots.filter((_, i) => i != existingIndex);
      setSlots(slots);
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
      <SlotConfigPanel
        slotConfig={slotConfig}
        setSlotConfig={setSlotConfig}
        slotType={slotType}
        setSlotType={setSlotType}
        handleSaveSlots={handleSaveSlots}
      />
      <Tabs defaultValue="create-slot" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="create-slot">Criação</TabsTrigger>
          <TabsTrigger value="booking-slot">Bookings</TabsTrigger>
        </TabsList>
        <TabsContent value="create-slot">
          <ChooseCustomSlot
            slots={slots[slotType]}
            dates={dates}
            tableRef={tableRef}
            timeSlots={timeSlots}
            getSlotForCell={getSlotForCell}
            getCellKey={getCellKey}
            selectedSlot={selectedSlot}
            handleCellClick={handleCellClick}
            getTypeColor={getTypeColor}
            formatDateHeader={formatDateHeader}
          />
        </TabsContent>
        <TabsContent value="booking-slot">
          <ChooseBookingSlot
            dates={dates}
            tableRef={tableRef}
            timeSlots={timeSlots}
            getSlotForCell={getBookingForCell}
            getCellKey={getCellKey}
            selectedSlot={selectedSlot}
            getTypeColor={getTypeColor}
            formatDateHeader={formatDateHeader}
            slotType={slotType}
            bookings={bookings[slotType]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
