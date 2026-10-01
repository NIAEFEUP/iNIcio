"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { addDays, format, isToday } from "date-fns";
import { pt } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Loader2,
  Paintbrush,
  Save,
  SlidersHorizontal,
  SquareDashed,
  Sun,
  Sunset,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { generateTimeSlots } from "@/lib/date";
import type { Dynamic, Interview, Slot, NewSlot } from "@/lib/db";

export type SlotOperation = {
  type: "add" | "remove";
  slot: Slot | NewSlot;
};
import type { CandidateListMetadata } from "@/lib/candidate";

import { SlotAdminStats } from "./slot-admin-stats";

export enum SlotType {
  interview = "interview",
  dynamic = "dynamic",
}

export type PaintShape = "paint" | "rect";
export type ViewDaysMode = "workdays" | "fullweek";

export interface SlotCell {
  date: Date;
  time: string;
}

interface CellPos {
  col: number;
  row: number;
}

type PendingSlot = Omit<Slot, "id"> & { id?: Slot["id"] };

interface SlotAdminCalendarProps {
  candidates: Array<CandidateListMetadata>;
  recruitmentId: number;
  existingSlots?: {
    interview: Slot[];
    dynamic: Slot[];
  };
  bookings: {
    interview: Array<
      Interview & {
        slot: Slot;
        candidate?: any;
        recruiters?: any[];
      }
    >;
    dynamic: Array<
      Dynamic & {
        slot: Slot;
        candidates?: any[];
        recruiters?: any[];
      }
    >;
  };
  saveSlots: (
    slots: SlotOperation[],
  ) => Promise<{ interview: Slot[]; dynamic: Slot[] }>;
}

function getMonday(d: Date = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatWeekRange(start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = format(start, "MMM", { locale: pt });
  const endMonth = format(end, "MMM", { locale: pt });
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear !== endYear) {
    return `${startDay} ${startMonth} ${startYear} — ${endDay} ${endMonth} ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startDay} ${startMonth} — ${endDay} ${endMonth} ${endYear}`;
  }
  return `${startDay} — ${endDay} ${startMonth} ${startYear}`;
}

function getEndTimeString(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const endH = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const endM = (total % 60).toString().padStart(2, "0");
  return `${endH}:${endM}`;
}

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

  const [baseline, setBaseline] = useState(existingSlots);
  const [saving, setSaving] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [slotType, setSlotType] = useState<SlotType>(SlotType.interview);
  const [shape, setShape] = useState<PaintShape>("paint");

  const [viewDaysMode, setViewDaysMode] = useState<ViewDaysMode>(() => {
    const all = [...existingSlots.interview, ...existingSlots.dynamic];
    const hasWeekend = all.some((s) => {
      const day = new Date(s.start).getDay();
      return day === 0 || day === 6;
    });
    return hasWeekend ? "fullweek" : "workdays";
  });

  const [slotConfig, setSlotConfig] = useState({
    interview: {
      duration: 30,
      quantity: 2,
    },
    dynamic: {
      duration: 45,
      quantity: 5,
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: "select" | "deselect";
    shape: PaintShape;
    lastCell: CellPos | null;
  } | null>(null);

  const [rect, setRect] = useState<{
    anchor: CellPos;
    current: CellPos;
    mode: "select" | "deselect";
  } | null>(null);

  const [hoveredCell, setHoveredCell] = useState<CellPos | null>(null);

  const dates = useMemo(() => {
    const daysCount = viewDaysMode === "workdays" ? 5 : 7;
    return Array.from({ length: daysCount }, (_, i) => addDays(weekStart, i));
  }, [weekStart, viewDaysMode]);

  const weekEnd = dates[dates.length - 1];

  const timeSlots = useMemo(() => {
    let minH = 9;
    let maxH = 19;
    const allSlots: Array<{ start?: Date } | undefined> = [
      ...slots.interview,
      ...slots.dynamic,
      ...(bookings.interview?.map((b) => b.slot) || []),
      ...(bookings.dynamic?.map((b) => b.slot) || []),
    ];
    for (const item of allSlots) {
      if (!item?.start) continue;
      const h = new Date(item.start).getHours();
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }
    const step = slotConfig[slotType].duration;
    const validStep = step > 0 && step <= 120 ? step : 30;
    return generateTimeSlots(minH, maxH, validStep);
  }, [slots, bookings, slotType, slotConfig]);

  const formatCellKey = (date: Date, time: string) => {
    const d = new Date(date);
    const datePart = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    return `${datePart}-${time}`;
  };

  const slotMap = useMemo(() => {
    const map = new Map<string, PendingSlot>();
    for (const item of slots[slotType]) {
      const d = new Date(item.start);
      const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      const key = formatCellKey(d, timePart);
      map.set(key, item);
    }
    return map;
  }, [slots, slotType]);

  const otherSlotType =
    slotType === SlotType.interview ? SlotType.dynamic : SlotType.interview;

  const otherSlotMap = useMemo(() => {
    const map = new Map<string, PendingSlot>();
    for (const item of slots[otherSlotType]) {
      const d = new Date(item.start);
      const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      const key = formatCellKey(d, timePart);
      map.set(key, item);
    }
    return map;
  }, [slots, otherSlotType]);

  const bookingsMap = useMemo(() => {
    const map = new Map<string, any[]>();
    const list = bookings[slotType] || [];
    for (const item of list) {
      const slotObj = (item as any)?.slot;
      if (!slotObj?.start) continue;
      const d = new Date(slotObj.start);
      const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      const key = formatCellKey(d, timePart);
      const existing = map.get(key) || [];
      existing.push(item);
      map.set(key, existing);
    }
    return map;
  }, [bookings, slotType]);

  const hasChanges = useMemo(() => {
    const types = [SlotType.interview, SlotType.dynamic];
    for (const type of types) {
      if (slots[type].length !== baseline[type].length) return true;
      const baselineSet = new Set(
        baseline[type].map((s) => new Date(s.start).getTime()),
      );
      if (
        slots[type].some((s) => !baselineSet.has(new Date(s.start).getTime()))
      ) {
        return true;
      }
    }
    return false;
  }, [slots, baseline]);

  useEffect(() => {
    if (!hasChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const moveWeek = (amount: number) => {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + amount * 7);
      return next;
    });
  };

  const cellStart = ({ date, time }: SlotCell): Date => {
    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);
    return start;
  };

  const cellFromPoint = (x: number, y: number): CellPos | null => {
    const el = document.elementFromPoint(x, y);
    const td = el?.closest("[data-cell-col]");
    if (!td || !containerRef.current?.contains(td)) return null;
    const col = Number(td.getAttribute("data-cell-col"));
    const row = Number(td.getAttribute("data-cell-row"));
    if (Number.isNaN(col) || Number.isNaN(row)) return null;
    return { col, row };
  };

  const toSlotCell = ({ col, row }: CellPos): SlotCell => ({
    date: dates[col],
    time: timeSlots[row],
  });

  const getRectCells = (anchor: CellPos, current: CellPos): SlotCell[] => {
    const minCol = Math.min(anchor.col, current.col);
    const maxCol = Math.max(anchor.col, current.col);
    const minRow = Math.min(anchor.row, current.row);
    const maxRow = Math.max(anchor.row, current.row);

    const cells: SlotCell[] = [];
    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        cells.push(toSlotCell({ col, row }));
      }
    }
    return cells;
  };

  const getPreviewFor = (
    col: number,
    row: number,
  ): "select" | "deselect" | null => {
    if (!rect) return null;
    const { anchor, current } = rect;
    const inCol =
      col >= Math.min(anchor.col, current.col) &&
      col <= Math.max(anchor.col, current.col);
    const inRow =
      row >= Math.min(anchor.row, current.row) &&
      row <= Math.max(anchor.row, current.row);
    return inCol && inRow ? rect.mode : null;
  };

  const onCellsChange = (cells: SlotCell[], selected: boolean) => {
    if (saving) return;

    setSlots((prev) => {
      const current = prev[slotType];

      if (selected) {
        const additions: PendingSlot[] = [];
        for (const cell of cells) {
          const start = cellStart(cell);
          const alreadyExists = current.some(
            (s) => new Date(s.start).getTime() === start.getTime(),
          );
          if (!alreadyExists) {
            additions.push({
              start,
              duration: slotConfig[slotType].duration,
              quantity: slotConfig[slotType].quantity,
              type: slotType,
              recruitmentId,
            });
          }
        }
        if (additions.length === 0) return prev;
        return { ...prev, [slotType]: [...current, ...additions] };
      }

      const cellStarts = new Set(cells.map((c) => cellStart(c).getTime()));
      let blockedCount = 0;
      const next = current.filter((s) => {
        if (!cellStarts.has(new Date(s.start).getTime())) return true;
        const d = new Date(s.start);
        const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
        const key = formatCellKey(d, timePart);
        const isBooked = (bookingsMap.get(key)?.length || 0) > 0;
        if (isBooked) {
          blockedCount++;
          return true;
        }
        return false;
      });

      if (blockedCount > 0) {
        toast.add({
          title: "Slots com marcações associadas não foram removidos",
        });
      }

      if (next.length === current.length) return prev;
      return { ...prev, [slotType]: next };
    });
  };

  const handlePointerDown = (
    date: Date,
    time: string,
    col: number,
    row: number,
  ) => {
    return (e: React.PointerEvent) => {
      if (e.button !== 0) return;

      const key = formatCellKey(date, time);
      const isSelected = slotMap.has(key);
      const isBooked = (bookingsMap.get(key)?.length || 0) > 0;

      if (isSelected && isBooked) {
        toast.add({
          title:
            "Este slot já tem marcações associadas e não pode ser removido aqui",
        });
        return;
      }

      const dragMode = isSelected ? "deselect" : "select";
      dragRef.current = { mode: dragMode, shape, lastCell: { col, row } };

      containerRef.current?.setPointerCapture(e.pointerId);

      if (shape === "paint") {
        onCellsChange([{ date, time }], dragMode === "select");
      } else {
        setRect({
          anchor: { col, row },
          current: { col, row },
          mode: dragMode,
        });
      }
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) {
      const cell = cellFromPoint(e.clientX, e.clientY);
      setHoveredCell(cell);
      return;
    }

    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    setHoveredCell(cell);

    if (drag.shape === "rect") {
      setRect((prev) =>
        prev && (prev.current.col !== cell.col || prev.current.row !== cell.row)
          ? { ...prev, current: cell }
          : prev,
      );
      return;
    }

    if (
      drag.lastCell &&
      drag.lastCell.col === cell.col &&
      drag.lastCell.row === cell.row
    ) {
      return;
    }

    drag.lastCell = cell;
    onCellsChange([toSlotCell(cell)], drag.mode === "select");
  };

  const handlePointerEnd = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;

    if (drag.shape === "rect" && rect) {
      onCellsChange(
        getRectCells(rect.anchor, rect.current),
        drag.mode === "select",
      );
      setRect(null);
    }
  };

  const handleApplyPreset = (presetType: string) => {
    const duration = slotConfig[slotType].duration;
    const quantity = slotConfig[slotType].quantity;

    const makeSlotsForDate = (date: Date, startH: number, endH: number) => {
      const created: PendingSlot[] = [];
      for (let h = startH; h < endH; h++) {
        for (let m = 0; m < 60; m += duration) {
          if (h * 60 + m + duration > endH * 60) continue;
          const d = new Date(date);
          d.setHours(h, m, 0, 0);
          created.push({
            start: d,
            duration,
            quantity,
            type: slotType,
            recruitmentId,
          });
        }
      }
      return created;
    };

    const getWeekTimeRange = (start: Date) => {
      const s = new Date(start);
      s.setHours(0, 0, 0, 0);
      const e = addDays(s, 7);
      return { startMs: s.getTime(), endMs: e.getTime() };
    };

    const { startMs: curWeekStartMs, endMs: curWeekEndMs } =
      getWeekTimeRange(weekStart);

    if (presetType === "workdays-full") {
      const newSlots: PendingSlot[] = [];
      for (let i = 0; i < 5; i++) {
        const d = addDays(weekStart, i);
        newSlots.push(...makeSlotsForDate(d, 9, 18));
      }
      setSlots((prev) => {
        const current = prev[slotType];
        const filtered = current.filter((s) => {
          const t = new Date(s.start).getTime();
          if (t < curWeekStartMs || t >= curWeekEndMs) return true;
          const d = new Date(s.start);
          const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
          return (bookingsMap.get(formatCellKey(d, timePart))?.length || 0) > 0;
        });
        const existingStarts = new Set(
          filtered.map((s) => new Date(s.start).getTime()),
        );
        const toAdd = newSlots.filter(
          (s) => !existingStarts.has(new Date(s.start).getTime()),
        );
        return { ...prev, [slotType]: [...filtered, ...toAdd] };
      });
      toast.add({ title: "Dias úteis preenchidos (09:00 - 18:00)" });
      return;
    }

    if (presetType === "workdays-morning") {
      const newSlots: PendingSlot[] = [];
      for (let i = 0; i < 5; i++) {
        const d = addDays(weekStart, i);
        newSlots.push(...makeSlotsForDate(d, 9, 13));
      }
      setSlots((prev) => {
        const current = prev[slotType];
        const filtered = current.filter((s) => {
          const t = new Date(s.start).getTime();
          if (t < curWeekStartMs || t >= curWeekEndMs) return true;
          const d = new Date(s.start);
          const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
          return (bookingsMap.get(formatCellKey(d, timePart))?.length || 0) > 0;
        });
        const existingStarts = new Set(
          filtered.map((s) => new Date(s.start).getTime()),
        );
        const toAdd = newSlots.filter(
          (s) => !existingStarts.has(new Date(s.start).getTime()),
        );
        return { ...prev, [slotType]: [...filtered, ...toAdd] };
      });
      toast.add({ title: "Manhãs preenchidas (09:00 - 13:00)" });
      return;
    }

    if (presetType === "workdays-afternoon") {
      const newSlots: PendingSlot[] = [];
      for (let i = 0; i < 5; i++) {
        const d = addDays(weekStart, i);
        newSlots.push(...makeSlotsForDate(d, 14, 18));
      }
      setSlots((prev) => {
        const current = prev[slotType];
        const filtered = current.filter((s) => {
          const t = new Date(s.start).getTime();
          if (t < curWeekStartMs || t >= curWeekEndMs) return true;
          const d = new Date(s.start);
          const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
          return (bookingsMap.get(formatCellKey(d, timePart))?.length || 0) > 0;
        });
        const existingStarts = new Set(
          filtered.map((s) => new Date(s.start).getTime()),
        );
        const toAdd = newSlots.filter(
          (s) => !existingStarts.has(new Date(s.start).getTime()),
        );
        return { ...prev, [slotType]: [...filtered, ...toAdd] };
      });
      toast.add({ title: "Tardes preenchidas (14:00 - 18:00)" });
      return;
    }

    if (presetType === "copy-previous-week") {
      const { startMs: prevWeekStartMs, endMs: prevWeekEndMs } =
        getWeekTimeRange(addDays(weekStart, -7));

      const prevWeekSlots = slots[slotType].filter((s) => {
        const t = new Date(s.start).getTime();
        return t >= prevWeekStartMs && t < prevWeekEndMs;
      });

      if (prevWeekSlots.length === 0) {
        toast.add({ title: "Não existem horários na semana anterior" });
        return;
      }

      const shifted = prevWeekSlots.map((s) => {
        const nextDate = new Date(s.start);
        nextDate.setDate(nextDate.getDate() + 7);
        return {
          start: nextDate,
          duration: s.duration,
          quantity: s.quantity,
          type: slotType,
          recruitmentId,
        };
      });

      setSlots((prev) => {
        const current = prev[slotType];
        const filtered = current.filter((s) => {
          const t = new Date(s.start).getTime();
          if (t < curWeekStartMs || t >= curWeekEndMs) return true;
          const d = new Date(s.start);
          const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
          return (bookingsMap.get(formatCellKey(d, timePart))?.length || 0) > 0;
        });
        const existingStarts = new Set(
          filtered.map((s) => new Date(s.start).getTime()),
        );
        const toAdd = shifted.filter(
          (s) => !existingStarts.has(new Date(s.start).getTime()),
        );
        return { ...prev, [slotType]: [...filtered, ...toAdd] };
      });
      toast.add({
        title: `${shifted.length} horários copiados da semana anterior`,
      });
      return;
    }

    if (presetType === "copy-to-next-week") {
      const thisWeekSlots = slots[slotType].filter((s) => {
        const t = new Date(s.start).getTime();
        return t >= curWeekStartMs && t < curWeekEndMs;
      });

      if (thisWeekSlots.length === 0) {
        toast.add({
          title: "Não existem horários na semana atual para copiar",
        });
        return;
      }

      const shifted = thisWeekSlots.map((s) => {
        const nextDate = new Date(s.start);
        nextDate.setDate(nextDate.getDate() + 7);
        return {
          start: nextDate,
          duration: s.duration,
          quantity: s.quantity,
          type: slotType,
          recruitmentId,
        };
      });

      const { startMs: nextWeekStartMs, endMs: nextWeekEndMs } =
        getWeekTimeRange(addDays(weekStart, 7));

      setSlots((prev) => {
        const current = prev[slotType];
        const filtered = current.filter((s) => {
          const t = new Date(s.start).getTime();
          return t < nextWeekStartMs || t >= nextWeekEndMs;
        });
        const existingStarts = new Set(
          filtered.map((s) => new Date(s.start).getTime()),
        );
        const toAdd = shifted.filter(
          (s) => !existingStarts.has(new Date(s.start).getTime()),
        );
        return { ...prev, [slotType]: [...filtered, ...toAdd] };
      });
      toast.add({
        title: `${shifted.length} horários duplicados para a próxima semana`,
      });
      return;
    }

    if (presetType === "clear-week") {
      setSlots((prev) => {
        const current = prev[slotType];
        let preservedCount = 0;
        const next = current.filter((s) => {
          const t = new Date(s.start).getTime();
          if (t < curWeekStartMs || t >= curWeekEndMs) return true;
          const d = new Date(s.start);
          const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
          const isBooked =
            (bookingsMap.get(formatCellKey(d, timePart))?.length || 0) > 0;
          if (isBooked) {
            preservedCount++;
            return true;
          }
          return false;
        });
        if (preservedCount > 0) {
          toast.add({
            title: `Horários da semana removidos (${preservedCount} com marcações mantidos)`,
          });
        } else {
          toast.add({ title: "Horários da semana atual removidos" });
        }
        return { ...prev, [slotType]: next };
      });
      return;
    }

    if (presetType === "clear-all") {
      setSlots((prev) => {
        const current = prev[slotType];
        let preservedCount = 0;
        const next = current.filter((s) => {
          const d = new Date(s.start);
          const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
          const isBooked =
            (bookingsMap.get(formatCellKey(d, timePart))?.length || 0) > 0;
          if (isBooked) {
            preservedCount++;
            return true;
          }
          return false;
        });
        if (preservedCount > 0) {
          toast.add({
            title: `Slots livres removidos (${preservedCount} com marcações mantidos)`,
          });
        } else {
          toast.add({ title: "Todos os slots deste tipo foram removidos" });
        }
        return { ...prev, [slotType]: next };
      });
      return;
    }
  };

  const handleDiscard = useCallback(() => {
    setSlots(baseline);
    toast.add({ title: "Alterações descartadas" });
  }, [baseline]);

  const handleSaveSlots = useCallback(async () => {
    if (saving || !hasChanges) return;

    const slotKey = (s: Slot | PendingSlot) =>
      `${s.type}-${new Date(s.start).getTime()}`;
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
      toast.add({ title: "Slots guardados com sucesso" });
    } catch (error) {
      toast.add({ title: "Erro ao guardar slots: " + error });
    } finally {
      setSaving(false);
    }
  }, [saving, hasChanges, slots, baseline, saveSlots]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges && !saving) {
          handleSaveSlots();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (hasChanges && !saving) {
          e.preventDefault();
          handleDiscard();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasChanges, saving, handleSaveSlots, handleDiscard]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestão de horários & slots"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border bg-card p-[0.5] shadow-2xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setWeekStart(getMonday(new Date()))}
              >
                Hoje
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => moveWeek(-1)}
                aria-label="Semana anterior"
                title="Semana anterior"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-28 text-center text-xs font-medium text-muted-foreground px-2 select-none">
                {formatWeekRange(weekStart, weekEnd)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => moveWeek(1)}
                aria-label="Semana seguinte"
                title="Semana seguinte"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleSaveSlots}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>Guardar</span>
            </Button>
          </div>
        }
      />

      <SlotAdminStats
        slots={slots}
        candidates={candidates}
        weekStart={weekStart}
        weekEnd={weekEnd}
        slotType={slotType}
      />

      <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="border-b bg-muted/20 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
                <Button
                  type="button"
                  size="sm"
                  variant={
                    slotType === SlotType.interview ? "secondary" : "ghost"
                  }
                  onClick={() => setSlotType(SlotType.interview)}
                >
                  <span className="size-2 rounded-full bg-blue-500 mr-1.5" />
                  <span>Entrevistas</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    slotType === SlotType.dynamic ? "secondary" : "ghost"
                  }
                  onClick={() => setSlotType(SlotType.dynamic)}
                >
                  <span className="size-2 rounded-full bg-emerald-500 mr-1.5" />
                  <span>Dinâmicas</span>
                </Button>
              </div>

              <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
                <Button
                  type="button"
                  size="sm"
                  variant={shape === "paint" ? "default" : "ghost"}
                  onClick={() => {
                    dragRef.current = null;
                    setRect(null);
                    setShape("paint");
                  }}
                >
                  <Paintbrush className="size-3.5" />
                  <span>Pintar</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={shape === "rect" ? "default" : "ghost"}
                  onClick={() => {
                    dragRef.current = null;
                    setRect(null);
                    setShape("rect");
                  }}
                >
                  <SquareDashed className="size-3.5" />
                  <span>Área</span>
                </Button>
              </div>

              <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
                <Button
                  type="button"
                  size="sm"
                  variant={viewDaysMode === "workdays" ? "secondary" : "ghost"}
                  onClick={() => setViewDaysMode("workdays")}
                >
                  Dias úteis
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewDaysMode === "fullweek" ? "secondary" : "ghost"}
                  onClick={() => setViewDaysMode("fullweek")}
                >
                  Semana inteira
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between lg:justify-end gap-2">
              <div className="hidden xl:flex items-center gap-3 text-xs text-muted-foreground mr-1">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-blue-600 dark:bg-blue-500" />
                  <span>Entrevista</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500" />
                  <span>Dinâmica</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs border border-border bg-background" />
                  <span>Sem slot</span>
                </div>
              </div>

              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <SlidersHorizontal className="size-3.5 opacity-60" />
                      <span>Configurar</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        ({slotConfig[slotType].duration}m ·{" "}
                        {slotConfig[slotType].quantity}{" "}
                        {slotConfig[slotType].quantity === 1 ? "vaga" : "vagas"}
                        )
                      </span>
                    </Button>
                  }
                />
                <PopoverContent align="end" className="w-64 p-3 space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Configuração (
                      {slotType === SlotType.interview
                        ? "Entrevista"
                        : "Dinâmica"}
                      )
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Parâmetros para novos slots criados
                    </p>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="slot-duration" className="text-xs">
                        Duração (minutos)
                      </Label>
                      <Input
                        id="slot-duration"
                        type="number"
                        value={slotConfig[slotType].duration}
                        onChange={(e) =>
                          setSlotConfig((prev) => ({
                            ...prev,
                            [slotType]: {
                              ...prev[slotType],
                              duration: Math.max(
                                15,
                                Number.parseInt(e.target.value) || 30,
                              ),
                            },
                          }))
                        }
                        min={15}
                        max={180}
                        step={15}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="slot-quantity" className="text-xs">
                        Vagas por slot
                      </Label>
                      <Input
                        id="slot-quantity"
                        type="number"
                        value={slotConfig[slotType].quantity}
                        onChange={(e) =>
                          setSlotConfig((prev) => ({
                            ...prev,
                            [slotType]: {
                              ...prev[slotType],
                              quantity: Math.max(
                                1,
                                Number.parseInt(e.target.value) || 1,
                              ),
                            },
                          }))
                        }
                        min={1}
                        max={20}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <span>Predefinições</span>
                      <ChevronDown className="size-3.5 opacity-60" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-64 p-1.5">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                      Preencher semana (
                      {slotType === SlotType.interview
                        ? "Entrevistas"
                        : "Dinâmicas"}
                      )
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleApplyPreset("workdays-full")}
                      className="flex items-center justify-between cursor-pointer py-1.5 px-2"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-primary" />
                        <span>Dias úteis</span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        09:00 – 18:00
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleApplyPreset("workdays-morning")}
                      className="flex items-center justify-between cursor-pointer py-1.5 px-2"
                    >
                      <div className="flex items-center gap-2">
                        <Sun className="size-4 text-amber-500" />
                        <span>Manhãs</span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        09:00 – 13:00
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleApplyPreset("workdays-afternoon")}
                      className="flex items-center justify-between cursor-pointer py-1.5 px-2"
                    >
                      <div className="flex items-center gap-2">
                        <Sunset className="size-4 text-orange-500" />
                        <span>Tardes</span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        14:00 – 18:00
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator className="my-1" />

                  <DropdownMenuGroup>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer py-1.5 px-2">
                        <Copy className="size-4 mr-2 text-muted-foreground" />
                        <span>Copiar semana</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-56 p-1">
                        <DropdownMenuItem
                          onClick={() =>
                            handleApplyPreset("copy-previous-week")
                          }
                          className="cursor-pointer py-1.5"
                        >
                          <ArrowLeft className="size-4 mr-2 text-muted-foreground" />
                          <span>Da semana anterior</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleApplyPreset("copy-to-next-week")}
                          className="cursor-pointer py-1.5"
                        >
                          <ArrowRight className="size-4 mr-2 text-muted-foreground" />
                          <span>Para a próxima semana</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer py-1.5 px-2 text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10">
                        <Trash2 className="size-4 mr-2 text-destructive" />
                        <span>Limpar</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-56 p-1">
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleApplyPreset("clear-week")}
                          className="cursor-pointer py-1.5"
                        >
                          <Trash2 className="size-4 mr-2" />
                          <span>
                            Semana atual (
                            {slotType === SlotType.interview
                              ? "Entrevistas"
                              : "Dinâmicas"}
                            )
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleApplyPreset("clear-all")}
                          className="cursor-pointer py-1.5"
                        >
                          <Trash2 className="size-4 mr-2" />
                          <span>
                            Todos os slots (
                            {slotType === SlotType.interview
                              ? "Entrevistas"
                              : "Dinâmicas"}
                            )
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="p-0">
          <div
            ref={containerRef}
            className="relative w-full overflow-x-auto touch-pan-x"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onLostPointerCapture={handlePointerEnd}
          >
            <table className="w-full border-collapse select-none text-left">
              <thead>
                <tr className="border-b border-border bg-muted/15">
                  <th className="sticky left-0 top-0 z-30 w-20 border-r border-border bg-card p-2 text-center text-xs font-semibold text-muted-foreground shadow-[1px_0_0_0_var(--border)]" />

                  {dates.map((date) => {
                    const today = isToday(date);
                    const dayName = format(date, "EEE", {
                      locale: pt,
                    }).replace(".", "");

                    return (
                      <th
                        key={date.toISOString()}
                        className={cn(
                          "min-w-[125px] border-r border-border py-2.5 px-2 text-center transition-colors select-none",
                          today && "bg-primary/5",
                        )}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            {dayName}
                          </span>
                          <span
                            className={cn(
                              "inline-flex size-6 items-center justify-center text-sm font-semibold text-foreground",
                              today &&
                                "rounded-full bg-primary text-xs font-bold text-primary-foreground",
                            )}
                          >
                            {format(date, "d")}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {timeSlots.map((time, row) => {
                  const isHour = time.endsWith(":00");

                  return (
                    <tr
                      key={time}
                      className={cn(
                        "transition-colors",
                        isHour
                          ? "border-t border-border/80"
                          : "border-t border-border/20 border-dashed",
                      )}
                    >
                      <td
                        className={cn(
                          "sticky left-0 z-20 w-20 border-r border-border bg-card p-1 text-center font-medium shadow-[1px_0_0_0_var(--border)] select-none",
                          isHour
                            ? "text-xs font-semibold text-foreground"
                            : "text-[11px] text-muted-foreground/75",
                        )}
                      >
                        {time}
                      </td>

                      {dates.map((date, col) => {
                        const cellKey = formatCellKey(date, time);
                        const currentSlot = slotMap.get(cellKey);
                        const otherSlot = otherSlotMap.get(cellKey);
                        const cellBookings = bookingsMap.get(cellKey) || [];
                        const preview = getPreviewFor(col, row);

                        const selected = Boolean(currentSlot);

                        const prevSelected =
                          row > 0 &&
                          slotMap.has(formatCellKey(date, timeSlots[row - 1]));
                        const nextSelected =
                          row < timeSlots.length - 1 &&
                          slotMap.has(formatCellKey(date, timeSlots[row + 1]));

                        const isTop = selected && !prevSelected;
                        const isBottom = selected && !nextSelected;
                        const isMiddle =
                          selected && prevSelected && nextSelected;
                        const isSingle =
                          selected && !prevSelected && !nextSelected;

                        let blockDurationStr = "";
                        let blockEndTimeStr = "";
                        if (isBottom && currentSlot) {
                          let blockStartRow = row;
                          while (
                            blockStartRow > 0 &&
                            slotMap.has(
                              formatCellKey(date, timeSlots[blockStartRow - 1]),
                            )
                          ) {
                            blockStartRow--;
                          }
                          const blockSlotsCount = row - blockStartRow + 1;
                          const blockTotalMin =
                            blockSlotsCount * currentSlot.duration;
                          const bHours = Math.floor(blockTotalMin / 60);
                          const bMins = blockTotalMin % 60;
                          blockDurationStr =
                            bHours > 0
                              ? `${bHours}h${bMins > 0 ? ` ${bMins}m` : ""}`
                              : `${bMins}m`;
                          blockEndTimeStr = getEndTimeString(
                            time,
                            currentSlot.duration,
                          );
                        }

                        const isCellHovered =
                          hoveredCell?.col === col && hoveredCell?.row === row;

                        const isInterview = slotType === SlotType.interview;

                        return (
                          <td
                            key={`${date.toISOString()}-${time}`}
                            data-cell-col={col}
                            data-cell-row={row}
                            className={cn(
                              "relative h-12 p-0 border-r border-border/40 touch-none transition-colors align-top",
                              !selected &&
                                !preview &&
                                "hover:bg-primary/8 cursor-pointer",
                              isToday(date) &&
                                !selected &&
                                !preview &&
                                "bg-primary/2",
                              preview === "select" &&
                                "bg-primary/20 ring-2 ring-inset ring-primary/80 z-10",
                              preview === "deselect" &&
                                "bg-destructive/20 ring-2 ring-inset ring-destructive/80 z-10 opacity-70",
                            )}
                            onPointerDown={handlePointerDown(
                              date,
                              time,
                              col,
                              row,
                            )}
                          >
                            {selected ? (
                              <div
                                className={cn(
                                  "relative flex w-full flex-col justify-between text-white select-none cursor-pointer transition-all",
                                  isInterview
                                    ? "bg-blue-600 dark:bg-blue-500"
                                    : "bg-emerald-600 dark:bg-emerald-500",
                                  isSingle &&
                                    "h-[calc(100%-6px)] my-0.75 mx-1 w-[calc(100%-8px)] rounded-md shadow-xs p-1",
                                  isTop &&
                                    !isBottom &&
                                    "h-[calc(100%-3px)] mt-0.75 mx-1 w-[calc(100%-8px)] rounded-t-md p-1 pb-0",
                                  isMiddle &&
                                    "h-full mx-1 w-[calc(100%-8px)] rounded-none px-1",
                                  isBottom &&
                                    !isTop &&
                                    "h-[calc(100%-3px)] mb-0.75 mx-1 w-[calc(100%-8px)] rounded-b-md p-1 pt-0",
                                )}
                              >
                                {isTop && (
                                  <div className="flex items-center justify-between gap-1 leading-none">
                                    <span className="text-[10px] font-semibold tracking-tight">
                                      {time}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {cellBookings.length > 0 && (
                                        <span className="rounded-xs bg-amber-400 text-amber-950 px-1 py-0.2 text-[8px] font-bold">
                                          {cellBookings.length} agend.
                                        </span>
                                      )}
                                      <span className="text-[9px] font-normal opacity-90">
                                        {currentSlot?.duration}m · ×
                                        {currentSlot?.quantity}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {isMiddle && row % 4 === 0 && (
                                  <div className="text-[9px] opacity-40 text-center select-none">
                                    ·
                                  </div>
                                )}

                                {isBottom && !isSingle && (
                                  <div className="flex items-center justify-between gap-1 leading-none text-[9px] font-medium opacity-90 pb-0.5">
                                    <span>até {blockEndTimeStr}</span>
                                    <span className="font-semibold text-white">
                                      {blockDurationStr}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : otherSlot ? (
                              <div className="h-[calc(100%-6px)] my-0.75 mx-1 w-[calc(100%-8px)] rounded-md border border-border/80 bg-muted/60 p-1 flex flex-col justify-between text-muted-foreground select-none">
                                <div className="flex items-center justify-between text-[9px] leading-tight font-medium">
                                  <span>{time}</span>
                                  <span
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      otherSlot.type === "interview"
                                        ? "bg-blue-500"
                                        : "bg-emerald-500",
                                    )}
                                  />
                                </div>
                                <span className="text-[9px] truncate opacity-75">
                                  {otherSlot.type === "interview"
                                    ? "Entrevista"
                                    : "Dinâmica"}
                                </span>
                              </div>
                            ) : (
                              isCellHovered &&
                              !preview && (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground/60 select-none pointer-events-none">
                                  + {time}
                                </div>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
