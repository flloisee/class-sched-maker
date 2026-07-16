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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetView, setSheetView] = useState<"list" | "form">("list");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editingEvent = events.find((e) => e.id === editingId) ?? null;
  const [formKey, setFormKey] = useState(0);

  function handleAdd(event: CalendarEvent) {
    setEvents((prev) => [...prev, event]);
    setSheetView("list");
  }

  function handleUpdate(event: CalendarEvent) {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    setEditingId(null);
    setSheetView("list");
  }

  function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function handleSelectEvent(event: CalendarEvent) {
    setEditingId(event.id);
    setSheetView("form");
    if (window.innerWidth <= 768) {
      setSheetOpen(true);
    } else {
      setFormKey((k) => k + 1);
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setSheetView("list");
  }

  function handleAddNew() {
    setEditingId(null);
    if (window.innerWidth > 768) {
      setFormKey((k) => k + 1);
    } else {
      setSheetView("form");
      setSheetOpen(true);
    }
  }

  function handleCloseSheet() {
    setSheetOpen(false);
    setEditingId(null);
    setSheetView("list");
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
      <button
        className="sheet-toggle"
        onClick={() => setSheetOpen((o) => !o)}
        aria-label="Toggle events panel"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 9.5L7 4.5L12 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Events
      </button>

      <div className="app-sidebar">
        <EventForm
          key={formKey}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          editingEvent={editingEvent}
          onCancelEdit={handleCancelEdit}
        />
        <EventList events={events} onDelete={handleDelete} onSelectEvent={handleSelectEvent} />
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

      {sheetOpen && (
        <div className="sheet-backdrop" onClick={handleCloseSheet} />
      )}
      <div className={`bottom-sheet${sheetOpen ? " open" : ""}`}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <span className="sheet-title">
            {sheetView === "form" ? (editingEvent ? "Edit Event" : "New Event") : "Events"}
          </span>
          {sheetView === "list" ? (
            <div className="sheet-actions">
              <button className="btn-small" onClick={handleAddNew}>+ New</button>
              <button className="btn-small" onClick={handleCloseSheet}>Done</button>
            </div>
          ) : (
            <button className="btn-small" onClick={() => { setEditingId(null); setSheetView("list"); }}>Back</button>
          )}
        </div>
        <div className="sheet-body">
          {sheetView === "list" ? (
            <>
              <EventList events={events} onDelete={handleDelete} onSelectEvent={handleSelectEvent} />
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
            </>
          ) : (
            <EventForm
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              editingEvent={editingEvent}
              onCancelEdit={handleCancelEdit}
            />
          )}
        </div>
      </div>

      <main className="app-main">
        <WeeklySchedule events={events} onSelectEvent={handleSelectEvent} onAddNew={handleAddNew} title={scheduleTitle} />
      </main>
    </div>
  );
}
