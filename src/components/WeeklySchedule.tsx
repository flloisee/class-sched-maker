import { useRef, useMemo, useState } from "react";
import type { CalendarEvent, Day } from "../types";
import { DAYS } from "../types";
import { parseTime, computeTimeRange, getHourLabels, formatTimeShort } from "../utils/time";
import { exportAsPNG, exportAsPDF } from "../utils/export";
import { exportAsTemplate } from "../utils/template";
import PaperSizeModal from "./PaperSizeModal";
import type { PaperSize } from "./PaperSizeModal";
import "./WeeklySchedule.css";
import "./PaperSizeModal.css";

interface Props {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  title: string;
}

function assignTracks(dayEvents: CalendarEvent[]) {
  const sorted = [...dayEvents].sort(
    (a, b) => parseTime(a.startTime) - parseTime(b.startTime)
  );
  const tracks: { end: number }[] = [];
  const assignment = new Map<string, number>();

  for (const event of sorted) {
    const start = parseTime(event.startTime);
    const end = parseTime(event.endTime);
    let placed = false;
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].end <= start) {
        tracks[i].end = end;
        assignment.set(event.id, i);
        placed = true;
        break;
      }
    }
    if (!placed) {
      tracks.push({ end });
      assignment.set(event.id, tracks.length - 1);
    }
  }

  return { assignment, trackCount: tracks.length };
}

export default function WeeklySchedule({ events, onSelectEvent, title }: Props) {
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const { timeStart, timeEnd } = useMemo(() => {
    const r = computeTimeRange(events);
    return { timeStart: r.start, timeEnd: r.end };
  }, [events]);

  const totalMinutes = timeEnd - timeStart;
  const hourLabels = useMemo(() => getHourLabels(timeStart, timeEnd), [timeStart, timeEnd]);

  const eventsByDay = useMemo(() => {
    const map: Record<Day, CalendarEvent[]> = {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: [],
    };
    for (const event of events) {
      for (const day of event.days) {
        map[day].push(event);
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
      <div className="schedule-empty">
        <div className="schedule-empty-icon">+</div>
        <div>Add an event to see your weekly schedule.</div>
      </div>
    );
  }

  function blendColor(hex: string, bgHex: string, alpha: number): string {
    const fr = parseInt(hex.slice(1, 3), 16);
    const fg = parseInt(hex.slice(3, 5), 16);
    const fb = parseInt(hex.slice(5, 7), 16);
    const br = parseInt(bgHex.slice(1, 3), 16);
    const bg = parseInt(bgHex.slice(3, 5), 16);
    const bb = parseInt(bgHex.slice(5, 7), 16);
    const r = Math.round(fr * alpha + br * (1 - alpha));
    const g = Math.round(fg * alpha + bg * (1 - alpha));
    const b = Math.round(fb * alpha + bb * (1 - alpha));
    return `rgb(${r},${g},${b})`;
  }

  function getEventStyle(event: CalendarEvent, day: Day) {
    const start = parseTime(event.startTime);
    const end = parseTime(event.endTime);
    const slotMinutes = totalMinutes + 60;
    const top = ((start - timeStart) / slotMinutes) * 100;
    const height = ((end - start) / slotMinutes) * 100;
    const { assignment, trackCount } = trackData[day];
    const track = assignment.get(event.id) ?? 0;
    const width = 100 / trackCount;
    const left = track * width;

    return {
      top: `${top}%`,
      height: `${height}%`,
      left: `${left}%`,
      width: `${width}%`,
      "--event-block-bg": blendColor(event.color, "#F7F6F2", 0.22),
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
              {eventsByDay[day].map((event) => (
                <div
                  key={event.id}
                  className="event-block"
                  style={getEventStyle(event, day)}
                  title={`${event.name}\n${formatTimeShort(parseTime(event.startTime))} – ${formatTimeShort(parseTime(event.endTime))}`}
                  onClick={() => onSelectEvent(event)}
                >
                  <span className="event-block-name">{event.name}</span>
                  <span className="event-block-time">
                    {formatTimeShort(parseTime(event.startTime))} — {formatTimeShort(parseTime(event.endTime))}
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
