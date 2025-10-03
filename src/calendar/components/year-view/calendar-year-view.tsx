import { useMemo } from "react";
import { addMonths, startOfYear } from "date-fns";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { YearViewMonth } from "@/calendar/components/year-view/year-view-month";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  allEvents: IEvent[];
}

export function CalendarYearView({ allEvents }: IProps) {
  const { selectedDate } = useCalendar();

  const months = useMemo(() => {
    const yearStart = startOfYear(selectedDate);
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
  }, [selectedDate]);

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map((month) => (
          <YearViewMonth
            key={month.toString()}
            month={month}
            events={allEvents}
          />
        ))}
      </div>
    </div>
  );
}
