import Link from "next/link";
import {
  Columns,
  Grid3x3,
  List,
  Plus,
  Grid2x2,
  CalendarRange,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { UserSelect } from "@/calendar/components/header/user-select";
import { TodayButton } from "@/calendar/components/header/today-button";
import { DateNavigator } from "@/calendar/components/header/date-navigator";

import type { IEvent } from "@/calendar/interfaces";
import type { TCalendarView } from "@/calendar/types";
import { useParams } from "next/navigation";

interface IProps {
  view: TCalendarView;
  events: IEvent[];
  urlId: string;
}

export function CalendarHeader({ view, events, urlId }: IProps) {
  const params = useParams();

  const id = params.id;

  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </div>

      <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
        <div className="flex w-full items-center gap-1.5">
          <div className="inline-flex first:rounded-r-none last:rounded-l-none [&:not(:first-child):not(:last-child)]:rounded-none">
            <Button
              asChild
              aria-label="View by day"
              size="icon"
              variant={view === "day" ? "default" : "outline"}
              className="rounded-r-none [&_svg]:size-5"
            >
              <Link href={`/calendar/${id}/day-view`}>
                <List strokeWidth={1.8} />
              </Link>
            </Button>

            <Button
              asChild
              aria-label="View by week"
              size="icon"
              variant={view === "week" ? "default" : "outline"}
              className="-ml-px rounded-none [&_svg]:size-5"
            >
              <Link href={`/calendar/${id}/week-view`}>
                <Columns strokeWidth={1.8} />
              </Link>
            </Button>

            <Button
              asChild
              aria-label="View by agenda"
              size="icon"
              variant={view === "agenda" ? "default" : "outline"}
              className="-ml-px rounded-l-none [&_svg]:size-5"
            >
              <Link href={`/calendar/${id}/agenda-view`}>
                <CalendarRange strokeWidth={1.8} />
              </Link>
            </Button>
          </div>

          <UserSelect />
        </div>
      </div>
    </div>
  );
}
