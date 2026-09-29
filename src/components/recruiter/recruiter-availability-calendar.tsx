"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { format, isToday } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Paintbrush,
  SquareDashed,
  ChevronDown,
  Clock,
  Sun,
  Sunset,
  Copy,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Sparkles,
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
import { cn } from "@/lib/utils";
import type { NewRecruiterAvailability } from "@/lib/db";

export interface SlotCell {
  date: Date;
  time: string;
}

export type PaintShape = "paint" | "rect";
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
  onApplyPreset: (type: string, targetDate?: Date) => void;
  shape: PaintShape;
  onShapeChange: (shape: PaintShape) => void;
  viewDaysMode: ViewDaysMode;
  onViewDaysModeChange: (mode: ViewDaysMode) => void;
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
  onApplyPreset,
  shape,
  onShapeChange,
  viewDaysMode,
  onViewDaysModeChange,
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

  const availabilityMap = useMemo(() => {
    const map = new Set<string>();
    for (const item of availabilities) {
      const d = new Date(item.start);
      const datePart = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      const timePart = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      map.add(`${datePart}-${timePart}`);
    }
    return map;
  }, [availabilities]);

  const hasSlot = useCallback(
    (date: Date, time: string): boolean => {
      const datePart = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
      return availabilityMap.has(`${datePart}-${time}`);
    },
    [availabilityMap],
  );

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

  const handlePointerDown = (
    date: Date,
    time: string,
    col: number,
    row: number,
  ) => {
    return (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const isSelected = hasSlot(date, time);
      const mode = isSelected ? "deselect" : "select";
      dragRef.current = { mode, shape, lastCell: { col, row } };

      containerRef.current?.setPointerCapture(e.pointerId);

      if (shape === "paint") {
        onCellsChange([{ date, time }], mode === "select");
      } else {
        setRect({ anchor: { col, row }, current: { col, row }, mode });
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

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="border-b bg-muted/20 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
              <Button
                type="button"
                size="sm"
                variant={shape === "paint" ? "default" : "ghost"}
                onClick={() => {
                  dragRef.current = null;
                  setRect(null);
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
                  onShapeChange("rect");
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
                onClick={() => onViewDaysModeChange("workdays")}
              >
                Dias úteis
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewDaysMode === "fullweek" ? "secondary" : "ghost"}
                onClick={() => onViewDaysModeChange("fullweek")}
              >
                Semana inteira
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground mr-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-primary" />
                <span>Disponível</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs border border-border bg-background" />
                <span>Indisponível</span>
              </div>
            </div>

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
                    Preencher semana
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => onApplyPreset("workdays-full")}
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
                    onClick={() => onApplyPreset("workdays-morning")}
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
                    onClick={() => onApplyPreset("workdays-afternoon")}
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
                        onClick={() => onApplyPreset("copy-previous-week")}
                        className="cursor-pointer py-1.5"
                      >
                        <ArrowLeft className="size-4 mr-2 text-muted-foreground" />
                        <span>Da semana anterior</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onApplyPreset("copy-to-next-week")}
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
                    <DropdownMenuSubContent className="w-52 p-1">
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onApplyPreset("clear-week")}
                        className="cursor-pointer py-1.5"
                      >
                        <Trash2 className="size-4 mr-2" />
                        <span>Semana atual</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onApplyPreset("clear-all")}
                        className="cursor-pointer py-1.5"
                      >
                        <Trash2 className="size-4 mr-2" />
                        <span>Todas as disponibilidades</span>
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

                {/* Day headers */}
                {dates.map((date) => {
                  const today = isToday(date);
                  const dayName = format(date, "EEE", { locale: pt }).replace(
                    ".",
                    "",
                  );

                  return (
                    <th
                      key={date.toISOString()}
                      className={cn(
                        "min-w-[110px] border-r border-border py-2.5 px-2 text-center transition-colors select-none",
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
                      const selected = hasSlot(date, time);
                      const preview = getPreviewFor(col, row);

                      const prevSelected =
                        row > 0 && hasSlot(date, timeSlots[row - 1]);
                      const nextSelected =
                        row < timeSlots.length - 1 &&
                        hasSlot(date, timeSlots[row + 1]);

                      const isTop = selected && !prevSelected;
                      const isBottom = selected && !nextSelected;
                      const isMiddle = selected && prevSelected && nextSelected;
                      const isSingle =
                        selected && !prevSelected && !nextSelected;

                      let blockDurationStr = "";
                      let blockEndTimeStr = "";
                      if (isBottom) {
                        let blockStartRow = row;
                        while (
                          blockStartRow > 0 &&
                          hasSlot(date, timeSlots[blockStartRow - 1])
                        ) {
                          blockStartRow--;
                        }
                        const blockSlotsCount = row - blockStartRow + 1;
                        const blockTotalMin = blockSlotsCount * slotMinutes;
                        const bHours = Math.floor(blockTotalMin / 60);
                        const bMins = blockTotalMin % 60;
                        blockDurationStr =
                          bHours > 0
                            ? `${bHours}h${bMins > 0 ? ` ${bMins}m` : ""}`
                            : `${bMins}m`;
                        blockEndTimeStr = getEndTimeString(time, slotMinutes);
                      }

                      const isCellHovered =
                        hoveredCell?.col === col && hoveredCell?.row === row;

                      return (
                        <td
                          key={`${date.toISOString()}-${time}`}
                          data-cell-col={col}
                          data-cell-row={row}
                          className={cn(
                            "relative h-10 p-0 border-r border-border/40 touch-none transition-colors",
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
                                "relative flex w-full flex-col justify-between bg-primary text-primary-foreground select-none cursor-pointer transition-all",
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
                                  {isSingle && (
                                    <span className="text-[9px] font-normal opacity-85">
                                      30m
                                    </span>
                                  )}
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
                                  <span className="font-semibold text-primary-foreground">
                                    {blockDurationStr}
                                  </span>
                                </div>
                              )}
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
  );
}
