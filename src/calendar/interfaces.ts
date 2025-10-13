import type { TEventColor } from "@/calendar/types";

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

export interface IEvent {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
  link: string;
  assigned?: Array<string> | null;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
