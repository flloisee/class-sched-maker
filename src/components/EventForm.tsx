import { useState, useEffect } from "react";
import type { CalendarEvent, Day, TimeSlot } from "../types";
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

function defaultSlot(): TimeSlot {
  return { startTime: "09:00", endTime: "10:00", days: ["Mon"] };
}

export default function EventForm({ onAdd, onUpdate, editingEvent, onCancelEdit }: Props) {
  const [name, setName] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([defaultSlot()]);
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
      setSlots(editingEvent.slots.map((s) => ({ ...s, days: [...s.days] })));
      setColor(editingEvent.color);
      setError("");
    }
  }, [editingEvent]);

  function updateSlot(index: number, field: keyof TimeSlot, value: TimeSlot[keyof TimeSlot]) {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  function toggleDayInSlot(index: number, day: Day) {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              days: s.days.includes(day)
                ? s.days.filter((d) => d !== day)
                : [...s.days, day],
            }
          : s,
      ),
    );
  }

  function addSlot() {
    setSlots((prev) => [...prev, defaultSlot()]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
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
    if (slots.length === 0) {
      setError("Add at least one time range.");
      return;
    }
    for (const [i, slot] of slots.entries()) {
      if (slot.startTime >= slot.endTime) {
        setError(`Time range #${i + 1}: end must be after start.`);
        return;
      }
      if (slot.days.length === 0) {
        setError(`Time range #${i + 1}: select at least one day.`);
        return;
      }
    }

    if (isEditing) {
      const updated: CalendarEvent = {
        ...editingEvent,
        name: name.trim(),
        slots: slots.map((s) => ({ ...s, days: [...s.days] })),
        color,
      };
      onUpdate(updated);
    } else {
      const event: CalendarEvent = {
        id: crypto.randomUUID(),
        name: name.trim(),
        slots: slots.map((s) => ({ ...s, days: [...s.days] })),
        color,
      };
      onAdd(event);
    }

    setName("");
    setSlots([defaultSlot()]);
    setColor(nextColor());
  }

  function handleCancel() {
    setName("");
    setSlots([defaultSlot()]);
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
          autoFocus
        />
      </label>

      <span className="form-section-label">Time Ranges</span>

      {slots.map((slot, index) => (
        <div key={index} className="slot-block">
          <div className="slot-header">
            <span className="slot-label">Range #{index + 1}</span>
            {slots.length > 1 && (
              <button
                type="button"
                className="slot-remove"
                onClick={() => removeSlot(index)}
                title="Remove time range"
              >
                ✕
              </button>
            )}
          </div>

          <div className="time-inputs">
            <label>
              Start
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateSlot(index, "startTime", e.target.value)}
              />
            </label>
            <label>
              End
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateSlot(index, "endTime", e.target.value)}
              />
            </label>
          </div>

          <div className="day-pills">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                className="day-pill"
                data-selected={slot.days.includes(day)}
                onClick={() => toggleDayInSlot(index, day)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button type="button" className="add-slot-btn" onClick={addSlot}>
        + Add time range
      </button>

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
