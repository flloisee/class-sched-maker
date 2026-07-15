export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type Day = (typeof DAYS)[number];

export interface TimeSlot {
  startTime: string;
  endTime: string;
  days: Day[];
}

export interface CalendarEvent {
  id: string;
  name: string;
  slots: TimeSlot[];
  color: string;
}
