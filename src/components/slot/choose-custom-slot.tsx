import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Paintbrush, SquareDashed } from "lucide-react";

import { ReactNode, useRef, useState } from "react";
import SlotBox from "./slot-box";

export interface SlotCell {
  date: Date;
  time: string;
}

interface ChooseCustomSlotProps {
  slots: any[];
  dates: Date[];
  tableRef: React.RefObject<HTMLTableElement | null>;
  timeSlots: string[];
  getSlotForCell: (date: Date, time: string, slots: any[]) => any;
  getCellKey: (date: Date, time: string) => Date;
  selectedSlot: any;
  onCellsChange: (cells: SlotCell[], selected: boolean) => void;
  getTypeColor: (type: any) => string;
  formatDateHeader: (date: Date) => {
    dayName: string;
    dayNumber: number;
    month: string;
  };
  headerAction?: ReactNode;
  legend?: ReactNode;
}

type PaintMode = "select" | "deselect";
type Shape = "paint" | "rect";

interface CellPos {
  col: number;
  row: number;
}

export default function ChooseCustomSlot({
  slots,
  dates,
  tableRef,
  timeSlots,
  getSlotForCell,
  getCellKey,
  selectedSlot,
  onCellsChange,
  getTypeColor,
  formatDateHeader,
  headerAction,
  legend,
}: ChooseCustomSlotProps) {
  const [shape, setShape] = useState<Shape>("paint");
  const dragRef = useRef<{
    mode: PaintMode;
    shape: Shape;
    lastCell: CellPos | null;
  } | null>(null);
  const [rect, setRect] = useState<{
    anchor: CellPos;
    current: CellPos;
    mode: PaintMode;
  } | null>(null);

  const cellFromPoint = (x: number, y: number): CellPos | null => {
    const el = document.elementFromPoint(x, y);
    const td = el?.closest("td[data-col]");
    if (!td || !tableRef.current?.contains(td)) return null;
    return {
      col: Number((td as HTMLElement).dataset.col),
      row: Number((td as HTMLElement).dataset.row),
    };
  };

  const toSlotCell = ({ col, row }: CellPos): SlotCell => ({
    date: dates[col],
    time: timeSlots[row],
  });

  const rectCells = (anchor: CellPos, current: CellPos): SlotCell[] => {
    const cells: SlotCell[] = [];
    for (
      let row = Math.min(anchor.row, current.row);
      row <= Math.max(anchor.row, current.row);
      row++
    ) {
      for (
        let col = Math.min(anchor.col, current.col);
        col <= Math.max(anchor.col, current.col);
        col++
      ) {
        cells.push(toSlotCell({ col, row }));
      }
    }
    return cells;
  };

  const previewFor = (col: number, row: number): PaintMode | null => {
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

  const onPointerDown = (
    date: Date,
    time: string,
    col: number,
    row: number,
  ) => {
    return (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const mode: PaintMode = getSlotForCell(date, time, slots)
        ? "deselect"
        : "select";
      dragRef.current = { mode, shape, lastCell: { col, row } };
      tableRef.current?.setPointerCapture(e.pointerId);

      if (shape === "paint") {
        onCellsChange([{ date, time }], mode === "select");
      } else {
        setRect({ anchor: { col, row }, current: { col, row }, mode });
      }
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;

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

  const endDrag = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;

    if (drag.shape === "rect" && rect) {
      onCellsChange(
        rectCells(rect.anchor, rect.current),
        drag.mode === "select",
      );
      setRect(null);
    }
  };

  const switchShape = (next: Shape) => {
    dragRef.current = null;
    setRect(null);
    setShape(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendário
        </CardTitle>
        <CardAction className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={shape === "paint" ? "default" : "outline"}
              onClick={() => switchShape("paint")}
            >
              <Paintbrush />
              Pintar
            </Button>
            <Button
              size="sm"
              variant={shape === "rect" ? "default" : "outline"}
              onClick={() => switchShape("rect")}
            >
              <SquareDashed />
              Área
            </Button>
          </div>
          {headerAction}
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table
            ref={tableRef}
            className="w-full border-collapse select-none"
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
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
              {timeSlots.map((time: string, row: number) => (
                <tr key={time} className="border-b">
                  <td className="p-3 font-medium text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {time}
                    </div>
                  </td>
                  {dates.map((date: Date, col: number) => {
                    const cellKey = getCellKey(date, time);
                    const existingSlot = getSlotForCell(date, time, slots);
                    const isSlotSelected =
                      selectedSlot &&
                      existingSlot &&
                      selectedSlot === existingSlot;

                    return (
                      <td
                        key={cellKey.toLocaleString()}
                        className="p-1 touch-none"
                        data-col={col}
                        data-row={row}
                        onPointerDown={onPointerDown(date, time, col, row)}
                      >
                        <SlotBox
                          existingSlot={existingSlot}
                          isSlotSelected={isSlotSelected}
                          getTypeColor={getTypeColor}
                          preview={previewFor(col, row)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {legend && <div className="mt-4">{legend}</div>}
      </CardContent>
    </Card>
  );
}
