import { useState, useEffect } from "react";
import type { CalendarEvent, Day } from "../types";
import { DAYS } from "../types";
import { nextColor } from "../utils/colors";
import "./EventForm.css";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

interface Props {
  onAdd: (event: CalendarEvent) => void;
  onUpdate: (event: CalendarEvent) => void;
  editingEvent: CalendarEvent | null;
  onCancelEdit: () => void;
}

export default function EventForm({ onAdd, onUpdate, editingEvent, onCancelEdit }: Props) {
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [days, setDays] = useState<Day[]>(["Mon"]);
  const [color, setColor] = useState(nextColor);
  const [hexInput, setHexInput] = useState(color);
  const [error, setError] = useState("");

  const isEditing = editingEvent !== null;

  useEffect(() => {
    setHexInput(color);
  }, [color]);

  useEffect(() => {
    if (editingEvent) {
      setName(editingEvent.name);
      setStartTime(editingEvent.startTime);
      setEndTime(editingEvent.endTime);
      setDays([...editingEvent.days]);
      setColor(editingEvent.color);
      setError("");
    }
  }, [editingEvent]);

  function toggleDay(day: Day) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleRandomColor() {
    setColor(nextColor());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Event name is required.");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }
    if (days.length === 0) {
      setError("Select at least one day.");
      return;
    }

    if (isEditing) {
      const updated: CalendarEvent = {
        ...editingEvent,
        name: name.trim(),
        startTime,
        endTime,
        days: [...days],
        color,
      };
      onUpdate(updated);
    } else {
      const event: CalendarEvent = {
        id: crypto.randomUUID(),
        name: name.trim(),
        startTime,
        endTime,
        days: [...days],
        color,
      };
      onAdd(event);
    }

    setName("");
    setStartTime("09:00");
    setEndTime("10:00");
    setDays(["Mon"]);
    setColor(nextColor());
  }

  function handleCancel() {
    setName("");
    setStartTime("09:00");
    setEndTime("10:00");
    setDays(["Mon"]);
    setColor(nextColor());
    setError("");
    onCancelEdit();
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <p className="form-section-label">{isEditing ? "Edit Event" : "New Event"}</p>

      <label>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Math 101"
        />
      </label>

      <div className="time-inputs">
        <label>
          Start
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
        <label>
          End
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </label>
      </div>

      <div>
        <span className="form-section-label">Days</span>
        <div className="day-pills">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              className="day-pill"
              data-selected={days.includes(day)}
              onClick={() => toggleDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="color-row">
        <label>
          Color
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <input
          type="text"
          className="hex-input"
          value={hexInput}
          onChange={(e) => {
            const raw = e.target.value;
            setHexInput(raw);
            if (HEX_RE.test(raw)) {
              setColor(raw);
            }
          }}
          onBlur={() => {
            if (!HEX_RE.test(hexInput)) {
              setHexInput(color);
            }
          }}
          placeholder="#000000"
          maxLength={7}
        />
        <button type="button" onClick={handleRandomColor} className="btn-small">
          Random
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        {isEditing && (
          <button type="button" onClick={handleCancel} className="btn-small">
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary">
          {isEditing ? "Save Changes" : "Add Event"}
        </button>
      </div>
    </form>
  );
}
