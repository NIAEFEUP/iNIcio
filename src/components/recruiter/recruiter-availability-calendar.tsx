"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { format, isToday } from "date-fns";
import { pt } from "date-fns/locale";
import { Paintbrush, SquareDashed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NewRecruiterAvailability } from "@/lib/db";

export interface SlotCell {
  date: Date;
  time: string;
}

export type PaintShape = "paint" | "rect";
/** @deprecated Weekends are deprecated; all calendars use 5 working days */
export type ViewDaysMode = "workdays" | "fullweek";

interface CellPos {
  col: number;
  row: number;
}

interface RecruiterAvailabilityCalendarProps {
  dates: Date[];
  timeSlots: string[];
  availabilities: NewRecruiterAvailability[];
  onCellsChange: (cells: SlotCell[], selected: boolean) => void;
  shape: PaintShape;
  onShapeChange: (shape: PaintShape) => void;
  viewDaysMode?: ViewDaysMode;
  onViewDaysModeChange?: (mode: ViewDaysMode) => void;
  slotMinutes?: number;
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

export function RecruiterAvailabilityCalendar({
  dates,
  timeSlots,
  availabilities,
  onCellsChange,
  shape,
  onShapeChange,
  slotMinutes = 30,
}: RecruiterAvailabilityCalendarProps) {
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

  const formatCellKey = (date: Date, time: string) => {
    const d = new Date(date);
    const datePart = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    return `${datePart}-${time}`;
  };

  const availabilityMap = useMemo(() => {
    const map = new Map<string, NewRecruiterAvailability>();
    for (const item of availabilities) {
      const d = new Date(item.start);
      const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      const key = formatCellKey(d, timePart);
      map.set(key, item);
    }
    return map;
  }, [availabilities]);

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
      return availabilityMap.has(key);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availabilityMap, dates, timeSlots],
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

  const handlePointerDown = (cell: CellPos, e: React.PointerEvent) => {
    if (e.button !== 0) return;

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

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
      {/* Calendar Toolbar */}
      <div className="border-b bg-muted/20 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Drawing mode toggles */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
              <Button
                type="button"
                size="sm"
                variant={shape === "paint" ? "default" : "ghost"}
                onClick={() => {
                  dragRef.current = null;
                  setRect(null);
                  setIsDragging(false);
                  onShapeChange("paint");
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
                  onShapeChange("rect");
                }}
              >
                <SquareDashed className="size-3.5" />
                <span>Área</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mr-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-primary" />
                <span>Disponível</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs border border-border bg-background" />
                <span>Indisponível</span>
              </div>
            </div>
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
                  const isAvailable = availabilityMap.has(key);
                  const inRect = isCellInRect(cell);
                  const isHovered =
                    hoveredCell?.col === colIndex &&
                    hoveredCell?.row === rowIndex;
                  const today = isToday(date);

                  let cellBg = "";
                  if (inRect && rect) {
                    cellBg =
                      rect.mode === "select"
                        ? "bg-primary/40 ring-1 ring-primary inset-0"
                        : "bg-destructive/30 ring-1 ring-destructive inset-0";
                  } else if (isAvailable) {
                    cellBg =
                      "bg-primary/20 text-primary-foreground border-primary/30";
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
                        "relative h-10 min-w-28 cursor-pointer border-r p-1 text-center transition-all last:border-r-0 touch-none",
                        today && !isAvailable && !inRect
                          ? "bg-primary/[0.03]"
                          : "",
                        cellBg,
                      )}
                    >
                      {isAvailable && (
                        <div className="flex flex-col h-full w-full justify-center p-0.5 text-[10px] text-foreground">
                          <span className="font-semibold text-primary">
                            {time} – {getEndTimeString(time, slotMinutes)}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
