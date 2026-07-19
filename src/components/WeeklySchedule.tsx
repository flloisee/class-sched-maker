import { useRef, useMemo, useState } from "react";
import type { CalendarEvent, Day, TimeSlot } from "../types";
import { DAYS } from "../types";
import { parseTime, computeTimeRange, getHourLabels, formatTimeShort } from "../utils/time";
import { exportAsPNG, exportAsPDF } from "../utils/export";
import { exportAsTemplate } from "../utils/template";
import { colorForTheme } from "../utils/colors";
import PaperSizeModal from "./PaperSizeModal";
import type { PaperSize } from "./PaperSizeModal";
import "./WeeklySchedule.css";
import "./PaperSizeModal.css";

interface Props {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddNew: () => void;
  title: string;
  isDark: boolean;
}

type SlotEntry = { event: CalendarEvent; slot: TimeSlot; slotIndex: number };

function assignTracks(dayEntries: SlotEntry[]) {
  const sorted = [...dayEntries].sort(
    (a, b) => parseTime(a.slot.startTime) - parseTime(b.slot.startTime),
  );
  const tracks: { end: number }[] = [];
  const assignment = new Map<string, number>();

  for (const entry of sorted) {
    const start = parseTime(entry.slot.startTime);
    const end = parseTime(entry.slot.endTime);
    const key = `${entry.event.id}-${entry.slotIndex}`;
    let placed = false;
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].end <= start) {
        tracks[i].end = end;
        assignment.set(key, i);
        placed = true;
        break;
      }
    }
    if (!placed) {
      tracks.push({ end });
      assignment.set(key, tracks.length - 1);
    }
  }

  return { assignment, trackCount: tracks.length };
}

export default function WeeklySchedule({ events, onSelectEvent, onAddNew, title, isDark }: Props) {
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const { timeStart, timeEnd } = useMemo(() => {
    const r = computeTimeRange(events);
    return { timeStart: r.start, timeEnd: r.end };
  }, [events]);

  const totalMinutes = timeEnd - timeStart;
  const hourLabels = useMemo(() => getHourLabels(timeStart, timeEnd), [timeStart, timeEnd]);

  const eventsByDay = useMemo(() => {
    const map: Record<Day, SlotEntry[]> = {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: [],
    };
    for (const event of events) {
      for (const [slotIndex, slot] of event.slots.entries()) {
        for (const day of slot.days) {
          map[day].push({ event, slot, slotIndex });
        }
      }
    }
    return map;
  }, [events]);

  const trackData = useMemo(() => {
    const data: Record<Day, { assignment: Map<string, number>; trackCount: number }> = {
      Mon: { assignment: new Map(), trackCount: 1 },
      Tue: { assignment: new Map(), trackCount: 1 },
      Wed: { assignment: new Map(), trackCount: 1 },
      Thu: { assignment: new Map(), trackCount: 1 },
      Fri: { assignment: new Map(), trackCount: 1 },
      Sat: { assignment: new Map(), trackCount: 1 },
      Sun: { assignment: new Map(), trackCount: 1 },
    };
    for (const day of DAYS) {
      data[day] = assignTracks(eventsByDay[day]);
    }
    return data;
  }, [eventsByDay]);

  if (events.length === 0) {
    return (
      <div className="schedule-empty" onClick={onAddNew} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onAddNew(); }}>
        <div className="schedule-empty-icon">+</div>
        <div>Add an event to see your weekly schedule.</div>
      </div>
    );
  }

  function getBgHex(): string {
    return getComputedStyle(document.documentElement).getPropertyValue("--bg-hex").trim() || "#F7F6F2";
  }

  function normalizeHex(hex: string): string {
    const h = hex.replace(/^#/, "");
    if (h.length === 3) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
    return `#${h}`;
  }

  function blendColor(hex: string, bgHex: string, alpha: number): string {
    const f = normalizeHex(hex);
    const bk = normalizeHex(bgHex);
    const fr = parseInt(f.slice(1, 3), 16);
    const fg = parseInt(f.slice(3, 5), 16);
    const fb = parseInt(f.slice(5, 7), 16);
    const br = parseInt(bk.slice(1, 3), 16);
    const bg = parseInt(bk.slice(3, 5), 16);
    const bb = parseInt(bk.slice(5, 7), 16);
    const r = Math.round(fr * alpha + br * (1 - alpha));
    const g = Math.round(fg * alpha + bg * (1 - alpha));
    const b = Math.round(fb * alpha + bb * (1 - alpha));
    return `rgb(${r},${g},${b})`;
  }

  const bgHex = getBgHex();

  function getEventStyle(entry: SlotEntry, day: Day) {
    const { event, slot, slotIndex } = entry;
    const start = parseTime(slot.startTime);
    const end = parseTime(slot.endTime);
    const slotMinutes = totalMinutes + 60;
    const top = ((start - timeStart) / slotMinutes) * 100;
    const height = ((end - start) / slotMinutes) * 100;
    const { assignment, trackCount } = trackData[day];
    const track = assignment.get(`${event.id}-${slotIndex}`) ?? 0;
    const width = 100 / trackCount;
    const left = track * width;

    return {
      top: `${top}%`,
      height: `${height}%`,
      left: `${left}%`,
      width: `${width}%`,
      "--event-block-bg": blendColor(colorForTheme(event.color, isDark), bgHex, isDark ? 0.22 : 0.30),
    } as React.CSSProperties;
  }

  const displayTitle = title || "Weekly Schedule";

  function titleFilename(ext: string) {
    return `${displayTitle.replace(/\s+/g, "_")}.${ext}`;
  }

  function handlePrintPNG() {
    if (scheduleRef.current) {
      exportAsPNG(scheduleRef.current, titleFilename("png"));
    }
  }

  function handlePrintPDF() {
    setPdfModalOpen(true);
  }

  function handleExportPDF(size: PaperSize) {
    setPdfModalOpen(false);
    if (scheduleRef.current) {
      exportAsPDF(scheduleRef.current, size, titleFilename("pdf"));
    }
  }

  function handleSaveTemplate() {
    exportAsTemplate(events, title, titleFilename("json"));
  }

  return (
    <div className="schedule-wrapper">
      <div className="schedule-actions">
        <button onClick={handlePrintPNG} className="btn-export">
          PNG
        </button>
        <button onClick={handlePrintPDF} className="btn-export">
          PDF
        </button>
        <button onClick={handleSaveTemplate} className="btn-export">
          Save Template
        </button>
      </div>
      <div className="schedule-container" ref={scheduleRef}>
        <div className="schedule-title-display">{displayTitle}</div>
        <div className="schedule-header">
          <div className="time-label-header">Time</div>
          {DAYS.map((day) => (
            <div key={day} className="day-header">
              {day}
            </div>
          ))}
        </div>
        <div className="schedule-body">
          <div className="time-column">
            {hourLabels.map((t) => (
              <div key={t} className="time-slot-label">
                {formatTimeShort(t)}
              </div>
            ))}
          </div>
          {DAYS.map((day) => (
            <div key={day} className="day-column">
              {hourLabels.map((t) => (
                <div key={t} className="hour-row-line" />
              ))}
              {eventsByDay[day].map((entry) => (
                <div
                  key={`${entry.event.id}-${entry.slotIndex}`}
                  className="event-block"
                  style={getEventStyle(entry, day)}
                  title={`${entry.event.name}\n${formatTimeShort(parseTime(entry.slot.startTime))} – ${formatTimeShort(parseTime(entry.slot.endTime))}`}
                  onClick={() => onSelectEvent(entry.event)}
                >
                  <span className="event-block-name">{entry.event.name}</span>
                  <span className="event-block-time">
                    {formatTimeShort(parseTime(entry.slot.startTime))} — {formatTimeShort(parseTime(entry.slot.endTime))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <PaperSizeModal
        open={pdfModalOpen}
        onSelect={handleExportPDF}
        onCancel={() => setPdfModalOpen(false)}
      />
    </div>
  );
}
