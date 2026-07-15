export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type Day = (typeof DAYS)[number];

export interface CalendarEvent {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: Day[];
  color: string;
}
