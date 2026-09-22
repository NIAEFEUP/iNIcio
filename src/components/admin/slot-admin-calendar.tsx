"use client";

import { useState, useRef } from "react";
import { toast } from "@/components/ui/toast";

import { Dynamic, Interview, Slot } from "@/lib/db";
import { SlotOperation } from "@/app/admin/interviews/page";
import ChooseCustomSlot, { SlotCell } from "../slot/choose-custom-slot";
import {
  formatDateHeader,
  generateDates,
  generateTimeSlots,
  getBookingsForCell,
  getCellKey,
  getSlotForCell,
} from "@/lib/date";
import SlotConfigPanel from "../slot/slot-config-panel";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChooseBookingSlot from "../slot/choose-booking-slot";
import { SlotAdminStats } from "./slot-admin-stats";
import { CandidateWithMetadata } from "@/lib/candidate";

interface SlotAdminCalendarProps {
  candidates: Array<CandidateWithMetadata>;
  recruitmentId: number;
  existingSlots?: {
    interview: Slot[];
    dynamic: Slot[];
  };
  bookings: {
    interview: Interview[];
    dynamic: Dynamic[];
  };
  saveSlots: (
    slots: SlotOperation[],
  ) => Promise<{ interview: Slot[]; dynamic: Slot[] }>;
}

export enum SlotType {
  interview = "interview",
  dynamic = "dynamic",
}

type PendingSlot = Omit<Slot, "id"> & { id?: Slot["id"] };

export default function SlotAdminCalendar({
  candidates,
  recruitmentId,
  existingSlots = {
    interview: [],
    dynamic: [],
  },
  bookings,
  saveSlots,
}: SlotAdminCalendarProps) {
  const [slots, setSlots] = useState<{
    interview: PendingSlot[];
    dynamic: PendingSlot[];
  }>(existingSlots);

  const [saving, setSaving] = useState(false);

  const [baseline, setBaseline] = useState(existingSlots);

  const [slotType, setSlotType] = useState<SlotType>(SlotType.interview);

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

  const cellStart = ({ date, time }: SlotCell) => {
    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);
    return start;
  };

  const onCellsChange = (cells: SlotCell[], selected: boolean) => {
    if (saving) return;
    setSlots((prev) => {
      const current = prev[slotType];

      if (selected) {
        const additions = cells
          .map(cellStart)
          .filter(
            (start) =>
              !current.some((s) => s.start.getTime() === start.getTime()),
          )
          .map((start) => ({
            start,
            duration: slotConfig[slotType].duration,
            quantity: slotConfig[slotType].quantity,
            type: slotType,
            recruitmentId,
          }));
        if (additions.length === 0) return prev;
        return { ...prev, [slotType]: [...current, ...additions] };
      }

      const starts = new Set(cells.map((cell) => cellStart(cell).getTime()));
      const next = current.filter((s) => !starts.has(s.start.getTime()));
      if (next.length === current.length) return prev;
      return { ...prev, [slotType]: next };
    });
  };

  const handleSaveSlots = async () => {
    if (saving) return;
    const slotKey = (s: Slot | PendingSlot) => s.start.getTime();
    const types = [SlotType.interview, SlotType.dynamic];

    const operations: SlotOperation[] = types.flatMap((type) => {
      const selectedStarts = new Set(slots[type].map(slotKey));
      const baselineStarts = new Set(baseline[type].map(slotKey));
      return [
        ...baseline[type]
          .filter((s) => !selectedStarts.has(slotKey(s)))
          .map((slot) => ({ type: "remove" as const, slot })),
        ...slots[type]
          .filter((s) => !baselineStarts.has(slotKey(s)))
          .map((slot) => ({ type: "add" as const, slot })),
      ];
    });

    setSaving(true);
    try {
      const updated = await saveSlots(operations);
      setSlots(updated);
      setBaseline(updated);
      toast.add({ title: "Slots guardados" });
    } catch (error) {
      toast.add({ title: "Erro ao guardar slots: " + error });
    } finally {
      setSaving(false);
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
      <SlotAdminStats
        slots={slots}
        slotType={slotType}
        candidates={candidates}
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
            onCellsChange={onCellsChange}
            getTypeColor={getTypeColor}
            formatDateHeader={formatDateHeader}
          />
        </TabsContent>
        <TabsContent value="booking-slot">
          <ChooseBookingSlot
            dates={dates}
            tableRef={tableRef}
            timeSlots={timeSlots}
            getSlotForCell={getBookingsForCell}
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
