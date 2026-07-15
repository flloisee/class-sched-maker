import { useState, useRef } from "react";
import type { CalendarEvent } from "./types";
import EventForm from "./components/EventForm";
import EventList from "./components/EventList";
import WeeklySchedule from "./components/WeeklySchedule";
import { parseTemplateFile } from "./utils/template";
import "./App.css";

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editingEvent = events.find((e) => e.id === editingId) ?? null;

  function handleAdd(event: CalendarEvent) {
    setEvents((prev) => [...prev, event]);
  }

  function handleUpdate(event: CalendarEvent) {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function handleSelectEvent(event: CalendarEvent) {
    setEditingId(event.id);
  }

  function handleCancelEdit() {
    setEditingId(null);
  }

  async function handleImportTemplate(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseTemplateFile(file);
      setEvents(data.events);
      setScheduleTitle(data.title ?? "");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Import failed");
    }
    e.target.value = "";
  }

  return (
    <div className="app">
      <header className="app-header">
        <input
          type="text"
          className="app-title-input"
          value={scheduleTitle}
          onChange={(e) => setScheduleTitle(e.target.value)}
          placeholder="Add a schedule title (e.g., Weekly Schedule)"
        />
      </header>
      <div className="app-sidebar">
        <EventForm
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          editingEvent={editingEvent}
          onCancelEdit={handleCancelEdit}
        />
        <EventList events={events} onDelete={handleDelete} />
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImportTemplate}
          style={{ display: "none" }}
        />
        <button
          className="btn-import"
          onClick={() => fileInputRef.current?.click()}
        >
          Import Template
        </button>
      </div>
      <main className="app-main">
        <WeeklySchedule events={events} onSelectEvent={handleSelectEvent} title={scheduleTitle} />
      </main>
    </div>
  );
}
