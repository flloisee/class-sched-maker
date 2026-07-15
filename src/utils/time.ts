import type { CalendarEvent } from "../types";

export function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatTimeShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}${period}` : `${h12}:${m.toString().padStart(2, "0")}${period}`;
}

interface TimeRange {
  start: number;
  end: number;
}

export function computeTimeRange(events: CalendarEvent[]): TimeRange {
  if (events.length === 0) return { start: 8 * 60, end: 20 * 60 };

  let min = Infinity;
  let max = -Infinity;
  for (const e of events) {
    const s = parseTime(e.startTime);
    const en = parseTime(e.endTime);
    if (s < min) min = s;
    if (en > max) max = en;
  }

  let start = min - 60;
  let end = max + 60;

  start = Math.floor(start / 60) * 60;
  end = Math.ceil(end / 60) * 60;

  if (end - start < 120) {
    if (start + 120 > end) end = start + 120;
  }

  return { start, end };
}

export function getHourLabels(start: number, end: number): number[] {
  const labels: number[] = [];
  for (let t = start; t <= end; t += 60) {
    labels.push(t);
  }
  return labels;
}

export function minutesSinceMidnight(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}
