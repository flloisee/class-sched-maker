import { useState, useRef, useEffect } from "react";
import type { CalendarEvent } from "./types";
import EventForm from "./components/EventForm";
import EventList from "./components/EventList";
import WeeklySchedule from "./components/WeeklySchedule";
import ThemeDropdown from "./components/ThemeDropdown";
import { THEMES } from "./components/ThemeDropdown";
import type { ThemeFamily, ThemeMode } from "./components/ThemeDropdown";
import { parseTemplateFile } from "./utils/template";
import "./App.css";

function loadStoredFamily(): ThemeFamily {
  const v = localStorage.getItem("theme-family");
  return (v && v in THEMES ? v : "default") as ThemeFamily;
}

function loadStoredMode(family: ThemeFamily): ThemeMode {
  const v = localStorage.getItem("theme-mode");
  const mode = v === "light" || v === "dark" ? v : "light";
  return mode in THEMES[family] ? mode : (Object.keys(THEMES[family]) as ThemeMode[])[0] ?? "light";
}

const INIT_FAMILY = loadStoredFamily();
const INIT_MODE = loadStoredMode(INIT_FAMILY);
document.documentElement.dataset.theme = THEMES[INIT_FAMILY][INIT_MODE] ?? "";

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetView, setSheetView] = useState<"list" | "form">("list");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [themeFamily, setThemeFamily] = useState<ThemeFamily>(INIT_FAMILY);
  const [themeMode, setThemeMode] = useState<ThemeMode>(INIT_MODE);

  useEffect(() => {
    localStorage.setItem("theme-family", themeFamily);
    localStorage.setItem("theme-mode", themeMode);
  }, [themeFamily, themeMode]);

  function toggleMode() {
    const nextMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(nextMode);
    document.documentElement.dataset.theme = THEMES[themeFamily][nextMode] ?? "";
  }

  const otherMode = themeMode === "light" ? "dark" : "light";
  const toggleDisabled = !(otherMode in THEMES[themeFamily]);

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
        <div className="app-header-title">
          <input
            type="text"
            className="app-title-input"
            value={scheduleTitle}
            onChange={(e) => setScheduleTitle(e.target.value)}
            placeholder="Add a schedule title (e.g., Weekly Schedule)"
          />
        </div>
        <div className="app-header-controls">
          <ThemeDropdown
            themeFamily={themeFamily}
            themeMode={themeMode}
            onThemeChange={(f, m) => {
              setThemeFamily(f);
              document.documentElement.dataset.theme = THEMES[f][m] ?? "";
            }}
          />
          <button
            className="theme-toggle"
            onClick={toggleMode}
            disabled={toggleDisabled}
            aria-label={`Switch to ${themeMode === "light" ? "dark" : "light"} mode`}
          >
            {themeMode === "light" ? (
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.5 2.5l1.5 1.5M12 12l1.5 1.5M2.5 13.5l1.5-1.5M12 4l1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                <path d="M13.5 8.5A5.5 5.5 0 0 1 7.5 2.5 5.5 5.5 0 1 0 13.5 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
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
        <WeeklySchedule events={events} onSelectEvent={handleSelectEvent} onAddNew={handleAddNew} title={scheduleTitle} isDark={themeMode === "dark"} />
      </main>
    </div>
  );
}
