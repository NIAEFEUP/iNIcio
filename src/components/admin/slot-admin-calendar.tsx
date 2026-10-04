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
  Loader2,
  Paintbrush,
  Save,
  SlidersHorizontal,
  SquareDashed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { generateTimeSlots, getMonday } from "@/lib/date";
import { WeekNavigator } from "@/components/calendar/week-navigator";
import type { Dynamic, Interview, Slot, NewSlot } from "@/lib/db";

export type SlotOperation = {
  type: "add" | "remove";
  slot: Slot | NewSlot;
};
import type {
  CandidateListMetadata,
  CandidateSchedulingStats,
} from "@/lib/candidate";

import { SlotAdminStats } from "./slot-admin-stats";

export enum SlotType {
  interview = "interview",
  dynamic = "dynamic",
}

export type PaintShape = "paint" | "rect";
/** @deprecated Weekends are deprecated; all calendars use 5 working days */
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
  candidates?: Array<CandidateListMetadata>;
  candidateStats?: CandidateSchedulingStats;
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
    operations: SlotOperation[],
  ) => Promise<{ interview: Slot[]; dynamic: Slot[] }>;
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

export function SlotAdminCalendar({
  candidates,
  candidateStats,
  recruitmentId,
  existingSlots,
  bookings,
  saveSlots,
}: SlotAdminCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [slotType, setSlotType] = useState<SlotType>(SlotType.interview);
  const [shape, setShape] = useState<PaintShape>("paint");
  const [saving, setSaving] = useState(false);

  const [slots, setSlots] = useState<{
    interview: PendingSlot[];
    dynamic: PendingSlot[];
  }>({
    interview: existingSlots?.interview ?? [],
    dynamic: existingSlots?.dynamic ?? [],
  });

  const [baseline, setBaseline] = useState(slots);

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
  const [isDragging, setIsDragging] = useState(false);

  // Always 5 working days (Monday to Friday)
  const dates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

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
    const currentDuration = slotConfig[slotType].duration;
    return generateTimeSlots(minH, maxH, currentDuration);
  }, [slots, bookings, slotType, slotConfig]);

  const formatCellKey = (date: Date, time: string) => {
    const d = new Date(date);
    const datePart = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    return `${datePart}-${time}`;
  };

  const slotMap = useMemo(() => {
    const map = new Map<string, PendingSlot>();
    for (const slot of slots[slotType]) {
      const d = new Date(slot.start);
      const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      const key = formatCellKey(d, timePart);
      map.set(key, slot);
    }
    return map;
  }, [slots, slotType]);

  const otherSlotMap = useMemo(() => {
    const otherType =
      slotType === SlotType.interview ? SlotType.dynamic : SlotType.interview;
    const map = new Map<string, PendingSlot>();
    for (const slot of slots[otherType]) {
      const d = new Date(slot.start);
      const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      const key = formatCellKey(d, timePart);
      map.set(key, slot);
    }
    return map;
  }, [slots, slotType]);

  const bookingsMap = useMemo(() => {
    const map = new Map<string, any[]>();
    const currentBookings = bookings[slotType] || [];
    for (const item of currentBookings) {
      const d = new Date(item.slot.start);
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

  const getCellKey = (cell: CellPos): string => {
    const slotCell = toSlotCell(cell);
    return formatCellKey(slotCell.date, slotCell.time);
  };

  const isCellAvailable = useCallback(
    (cell: CellPos) => {
      const key = getCellKey(cell);
      return slotMap.has(key);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slotMap, dates, timeSlots],
  );

  const isCellBooked = useCallback(
    (cell: CellPos) => {
      const key = getCellKey(cell);
      return bookingsMap.has(key);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookingsMap, dates, timeSlots],
  );

  const getRectCells = (start: CellPos, end: CellPos): SlotCell[] => {
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);

    const cells: SlotCell[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        cells.push(toSlotCell({ col: c, row: r }));
      }
    }
    return cells;
  };

  const isCellInRect = (cell: CellPos) => {
    if (!rect) return false;
    const minCol = Math.min(rect.anchor.col, rect.current.col);
    const maxCol = Math.max(rect.anchor.col, rect.current.col);
    const minRow = Math.min(rect.anchor.row, rect.current.row);
    const maxRow = Math.max(rect.anchor.row, rect.current.row);
    return (
      cell.col >= minCol &&
      cell.col <= maxCol &&
      cell.row >= minRow &&
      cell.row <= maxRow
    );
  };

  const onCellsChange = (cells: SlotCell[], selected: boolean) => {
    const bookedTimes = new Set(
      (bookings[slotType] || []).map((b) => new Date(b.slot.start).getTime()),
    );

    setSlots((prev) => {
      const next = [...prev[slotType]];
      for (const c of cells) {
        const time = cellStart(c).getTime();
        if (bookedTimes.has(time)) continue;

        const idx = next.findIndex((s) => new Date(s.start).getTime() === time);
        if (selected && idx === -1) {
          next.push({
            start: cellStart(c),
            duration: slotConfig[slotType].duration,
            quantity: slotConfig[slotType].quantity,
            type: slotType,
            recruitmentId,
          });
        } else if (!selected && idx !== -1) {
          next.splice(idx, 1);
        }
      }
      return next.length === prev[slotType].length
        ? prev
        : { ...prev, [slotType]: next };
    });
  };

  const handlePointerDown = (cell: CellPos, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (isCellBooked(cell)) return;

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const mode = isCellAvailable(cell) ? "deselect" : "select";
    dragRef.current = { mode, shape, lastCell: cell };
    setIsDragging(true);

    if (shape === "rect") {
      setRect({ anchor: cell, current: cell, mode });
    } else {
      onCellsChange([toSlotCell(cell)], mode === "select");
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const cell = cellFromPoint(e.clientX, e.clientY);

    if (cell) {
      setHoveredCell((prev) =>
        prev?.col === cell.col && prev?.row === cell.row ? prev : cell,
      );
    } else {
      setHoveredCell(null);
    }

    if (!drag || !cell) return;

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
    setIsDragging(false);
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

  const handleSaveSlots = useCallback(async () => {
    if (saving || !hasChanges) return;

    const operations: SlotOperation[] = [];
    const types = [SlotType.interview, SlotType.dynamic];

    for (const type of types) {
      const current = slots[type];
      const base = baseline[type];

      const baseMap = new Map(
        base.map((s) => [new Date(s.start).getTime(), s]),
      );
      const currentMap = new Map(
        current.map((s) => [new Date(s.start).getTime(), s]),
      );

      for (const [time, slot] of currentMap) {
        if (!baseMap.has(time)) {
          operations.push({ type: "add", slot: slot as NewSlot });
        }
      }

      for (const [time, slot] of baseMap) {
        if (!currentMap.has(time) && slot.id) {
          operations.push({ type: "remove", slot: slot as Slot });
        }
      }
    }

    try {
      setSaving(true);
      const saved = await saveSlots(operations);
      setBaseline(saved);
      setSlots(saved);
      toast.add({ type: "success", title: "Horários guardados com sucesso" });
    } catch {
      toast.add({
        type: "error",
        title: "Ocorreu um erro ao guardar os horários",
      });
    } finally {
      setSaving(false);
    }
  }, [saving, hasChanges, slots, baseline, saveSlots]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestão de horários & slots"
        viewModeToggle={
          <Button
            size="sm"
            onClick={handleSaveSlots}
            disabled={!hasChanges || saving}
            className="h-8 gap-1.5 px-2.5 md:px-3 text-xs shrink-0"
            title="Guardar alterações"
            aria-label="Guardar alterações"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span className="hidden md:inline">Guardar</span>
          </Button>
        }
        actions={
          <WeekNavigator
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            className="w-full md:w-auto"
          />
        }
      />

      <SlotAdminStats
        slots={slots}
        candidates={candidates}
        candidateStats={candidateStats}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />

      <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
        {/* Calendar Toolbar */}
        <div className="border-b bg-muted/20 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Slot type tabs and shape toggles */}
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
                  <span className="ml-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 text-[10px] font-semibold">
                    {slots.interview.length}
                  </span>
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
                  <span className="ml-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-semibold">
                    {slots.dynamic.length}
                  </span>
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
                    setIsDragging(false);
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
                    setIsDragging(false);
                    setShape("rect");
                  }}
                >
                  <SquareDashed className="size-3.5" />
                  <span>Área</span>
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
                      <SlidersHorizontal className="size-3.5" />
                      <span>Configuração</span>
                    </Button>
                  }
                />
                <PopoverContent align="end" className="w-72 p-3 space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold leading-none">
                      Configurar{" "}
                      {slotType === SlotType.interview
                        ? "Entrevistas"
                        : "Dinâmicas"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Define a duração e vagas ao desenhar novos slots.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 items-center gap-2">
                      <Label htmlFor="cfg-dur" className="text-xs">
                        Duração (min)
                      </Label>
                      <Input
                        id="cfg-dur"
                        type="number"
                        min="5"
                        step="5"
                        value={slotConfig[slotType].duration}
                        onChange={(e) => {
                          const val = Math.max(5, Number(e.target.value) || 30);
                          setSlotConfig((prev) => ({
                            ...prev,
                            [slotType]: { ...prev[slotType], duration: val },
                          }));
                        }}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 items-center gap-2">
                      <Label htmlFor="cfg-qty" className="text-xs">
                        Vagas por slot
                      </Label>
                      <Input
                        id="cfg-qty"
                        type="number"
                        min="1"
                        value={slotConfig[slotType].quantity}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value) || 1);
                          setSlotConfig((prev) => ({
                            ...prev,
                            [slotType]: { ...prev[slotType], quantity: val },
                          }));
                        }}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Calendar Grid Table */}
        <div
          ref={containerRef}
          className="w-full overflow-x-auto select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
                <th className="sticky left-0 z-20 w-18 border-r bg-muted/40 px-3 py-2 text-center">
                  Hora
                </th>
                {dates.map((date) => {
                  const today = isToday(date);
                  return (
                    <th
                      key={date.toISOString()}
                      className={cn(
                        "border-r px-3 py-2 text-center transition-colors last:border-r-0",
                        today ? "bg-primary/10 text-primary font-bold" : "",
                      )}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[11px] uppercase tracking-wider font-semibold">
                          {format(date, "EEE", { locale: pt })}
                        </span>
                        <span
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                            today
                              ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                              : "text-foreground",
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
            <tbody className="divide-y divide-border text-xs">
              {timeSlots.map((time, rowIndex) => (
                <tr
                  key={time}
                  className="group hover:bg-muted/10 transition-colors"
                >
                  <td className="sticky left-0 z-10 w-18 border-r bg-background/95 px-2 py-1 text-center font-mono text-[11px] text-muted-foreground select-none">
                    {time}
                  </td>
                  {dates.map((date, colIndex) => {
                    const cell: CellPos = { col: colIndex, row: rowIndex };
                    const key = getCellKey(cell);
                    const slot = slotMap.get(key);
                    const otherSlot = otherSlotMap.get(key);
                    const cellBookings = bookingsMap.get(key);
                    const isBooked = cellBookings && cellBookings.length > 0;
                    const inRect = isCellInRect(cell);
                    const isHovered =
                      hoveredCell?.col === colIndex &&
                      hoveredCell?.row === rowIndex;
                    const today = isToday(date);

                    let cellBg = "";
                    let content: React.ReactNode = null;

                    if (inRect && rect) {
                      cellBg =
                        rect.mode === "select"
                          ? "bg-primary/40 ring-1 ring-primary inset-0"
                          : "bg-destructive/30 ring-1 ring-destructive inset-0";
                    } else if (isBooked) {
                      cellBg =
                        slotType === SlotType.interview
                          ? "bg-blue-600 text-white"
                          : "bg-emerald-600 text-white";
                      content = (
                        <div className="flex flex-col h-full w-full justify-center p-1 text-[10px]">
                          <div className="flex items-center justify-between gap-1 leading-tight">
                            <span className="font-semibold truncate">
                              {slotType === SlotType.interview
                                ? cellBookings[0]?.candidate?.name || "Ocupado"
                                : `${cellBookings[0]?.candidates?.length || 0} inscritos`}
                            </span>
                            {otherSlot && (
                              <span
                                className={cn(
                                  "rounded px-1 py-0.5 text-[8px] font-bold shrink-0 leading-none",
                                  slotType === SlotType.interview
                                    ? "bg-emerald-400 text-emerald-950"
                                    : "bg-blue-200 text-blue-950",
                                )}
                                title={
                                  slotType === SlotType.interview
                                    ? "Dinâmica em simultâneo"
                                    : "Entrevista em simultâneo"
                                }
                              >
                                {slotType === SlotType.interview
                                  ? "Dinâmica"
                                  : "Entrevista"}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] opacity-80">
                            {time} –{" "}
                            {getEndTimeString(
                              time,
                              slot?.duration || slotConfig[slotType].duration,
                            )}
                          </span>
                        </div>
                      );
                    } else if (slot) {
                      cellBg =
                        slotType === SlotType.interview
                          ? "bg-blue-500/20 text-blue-900 dark:text-blue-100 border-blue-500/30"
                          : "bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 border-emerald-500/30";
                      content = (
                        <div className="flex flex-col h-full w-full justify-center p-1 text-[10px]">
                          <div className="flex items-center justify-between gap-1 leading-tight">
                            <span className="font-medium text-foreground truncate">
                              {time} – {getEndTimeString(time, slot.duration)}
                            </span>
                            {otherSlot && (
                              <span
                                className={cn(
                                  "rounded px-1 py-0.5 text-[8px] font-semibold shrink-0 leading-none",
                                  slotType === SlotType.interview
                                    ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                                    : "bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/30",
                                )}
                                title={
                                  slotType === SlotType.interview
                                    ? "Dinâmica em simultâneo"
                                    : "Entrevista em simultâneo"
                                }
                              >
                                {slotType === SlotType.interview
                                  ? "Dinâmica"
                                  : "Entrevista"}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-muted-foreground">
                            {slot.quantity} vagas
                          </span>
                        </div>
                      );
                    } else if (otherSlot) {
                      cellBg =
                        slotType === SlotType.interview
                          ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-dashed hover:bg-emerald-500/20"
                          : "bg-blue-500/10 text-blue-800 dark:text-blue-200 border-dashed hover:bg-blue-500/20";
                      content = (
                        <div className="flex flex-col h-full w-full justify-center p-1 text-[9px] opacity-70 hover:opacity-100 transition-opacity">
                          <span className="truncate font-medium">
                            {slotType === SlotType.interview
                              ? "Dinâmica"
                              : "Entrevista"}
                          </span>
                          <span className="text-[8px] opacity-75">
                            +{" "}
                            {slotType === SlotType.interview
                              ? "Entrevista"
                              : "Dinâmica"}
                          </span>
                        </div>
                      );
                    } else if (isHovered && !isDragging) {
                      cellBg = "bg-muted/60";
                    }

                    return (
                      <td
                        key={key}
                        data-cell-col={colIndex}
                        data-cell-row={rowIndex}
                        onPointerDown={(e) => handlePointerDown(cell, e)}
                        className={cn(
                          "relative h-10 min-w-28 cursor-pointer border-r p-0 text-center transition-all last:border-r-0 touch-none",
                          today && !slot && !otherSlot && !inRect
                            ? "bg-primary/[0.03]"
                            : "",
                          cellBg,
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SlotAdminCalendar;
