"use client";

import { useDrag } from "react-dnd";
import { useRef, useEffect, useCallback } from "react";
import { getEmptyImage } from "react-dnd-html5-backend";

import { cn } from "@/lib/utils";

import type { IEvent } from "@/calendar/interfaces";

export const ItemTypes = {
  EVENT: "event",
};

interface DraggableEventProps {
  event: IEvent;
  children: React.ReactNode;
}

export function DraggableEvent({ event, children }: DraggableEventProps) {
  const measureRef = useRef<HTMLDivElement | null>(null);

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ItemTypes.EVENT,
    item: () => {
      const width = measureRef.current?.offsetWidth || 0;
      const height = measureRef.current?.offsetHeight || 0;
      return { event, children, width, height };
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  // Hide the default drag preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      measureRef.current = node;
      drag(node);
    },
    [drag],
  );

  return (
    <div ref={setRef} className={cn(isDragging && "opacity-40")}>
      {children}
    </div>
  );
}
