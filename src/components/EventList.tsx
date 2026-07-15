import type { CalendarEvent } from "../types";
import { parseTime, formatTimeShort } from "../utils/time";
import "./EventList.css";

interface Props {
  events: CalendarEvent[];
  onDelete: (id: string) => void;
}

export default function EventList({ events, onDelete }: Props) {
  return (
    <div className="event-list">
      <div className="event-list-header">
        <h2>Events</h2>
        {events.length > 0 && (
          <span className="event-list-count">{events.length}</span>
        )}
      </div>
      {events.length === 0 ? (
        <div className="event-list-empty">
          Add an event to get started
        </div>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id} className="event-list-item">
              <span
                className="event-color-dot"
                style={{ background: event.color }}
              />
              <div className="event-info">
                <strong>{event.name}</strong>
                <span className="event-meta">
                  {event.slots.map((slot, i) => (
                    <span key={i} className="event-meta-slot">
                      {slot.days.join(", ")} {formatTimeShort(parseTime(slot.startTime))}–{formatTimeShort(parseTime(slot.endTime))}
                    </span>
                  ))}
                </span>
              </div>
              <button
                className="btn-delete"
                onClick={() => onDelete(event.id)}
                title="Delete event"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
