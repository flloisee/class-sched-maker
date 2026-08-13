import type { CalendarEvent, TimeSlot } from "../types";

export interface ScheduleTemplate {
  title: string;
  events: CalendarEvent[];
}

function migrateEvent(event: Partial<CalendarEvent> & { startTime?: string; endTime?: string; days?: string[] }): CalendarEvent {
  if (!event.slots) {
    const slots: TimeSlot[] = [{
      startTime: event.startTime ?? "09:00",
      endTime: event.endTime ?? "10:00",
      days: (event.days ?? ["Mon"]) as CalendarEvent["slots"][number]["days"],
    }];
    return {
      id: event.id ?? crypto.randomUUID(),
      name: event.name ?? "",
      slots,
      color: event.color ?? "#4A90D9",
    };
  }
  return event as CalendarEvent;
}

export function parseTemplate(text: string): ScheduleTemplate {
  const data = JSON.parse(text);
  if (!Array.isArray(data.events)) {
    throw new Error("Invalid template: missing events array");
  }
  data.events = data.events.map(migrateEvent);
  return data as ScheduleTemplate;
}
