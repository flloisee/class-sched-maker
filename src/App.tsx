import { useState, useRef, useEffect } from "react";
import type { CalendarEvent } from "./types";
import EventForm from "./components/EventForm";
import EventList from "./components/EventList";
import WeeklySchedule from "./components/WeeklySchedule";
import ThemeDropdown from "./components/ThemeDropdown";
import { THEMES } from "./components/ThemeDropdown";
import type { ThemeFamily, ThemeMode } from "./components/ThemeDropdown";
import { parseTemplate, serializeSchedule } from "./utils/template";
import { extractSchedule } from "./utils/png";
import { extractScheduleFromPDF } from "./utils/export";
import { extractShareHash, decodeShareData, parseSharePayload } from "./utils/share";
import { resetColorIndex } from "./utils/colors";
import "./components/PaperSizeModal.css";
import "./App.css";

declare global {
  interface Window {
    __LOAD_START__?: number;
  }
}

function loadStoredFamily(): ThemeFamily {
  const v = localStorage.getItem("theme-family");
  return (v && v in THEMES ? v : "default") as ThemeFamily;
}

function loadStoredMode(family: ThemeFamily): ThemeMode {
  const v = localStorage.getItem("theme-mode");
  const mode = v === "light" || v === "dark" ? v : "light";
  return mode in THEMES[family] ? mode : (Object.keys(THEMES[family]) as ThemeMode[])[0] ?? "light";
}

const SCHEDULE_KEY = "flloisee-schedule";
const LEGACY_SCHEDULE_KEY = "schedule";

function loadStoredSchedule(): { events: CalendarEvent[]; title: string } {
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY) ?? localStorage.getItem(LEGACY_SCHEDULE_KEY);
    if (raw) localStorage.removeItem(LEGACY_SCHEDULE_KEY);
    if (!raw) return { events: [], title: "" };
    const data = parseTemplate(raw);
    return { events: data.events, title: data.title ?? "" };
  } catch {
    return { events: [], title: "" };
  }
}

const INIT_SCHEDULE = loadStoredSchedule();

const INIT_FAMILY = loadStoredFamily();
const INIT_MODE = loadStoredMode(INIT_FAMILY);
document.documentElement.dataset.theme = THEMES[INIT_FAMILY][INIT_MODE] ?? "";

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>(INIT_SCHEDULE.events);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scheduleTitle, setScheduleTitle] = useState(INIT_SCHEDULE.title);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetView, setSheetView] = useState<"list" | "form">("list");
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const shareRestored = useRef(false);

  const [themeFamily, setThemeFamily] = useState<ThemeFamily>(INIT_FAMILY);
  const [themeMode, setThemeMode] = useState<ThemeMode>(INIT_MODE);

  useEffect(() => {
    localStorage.setItem("theme-family", themeFamily);
    localStorage.setItem("theme-mode", themeMode);
  }, [themeFamily, themeMode]);

  useEffect(() => {
    localStorage.setItem(SCHEDULE_KEY, serializeSchedule({ title: scheduleTitle, events }));
  }, [scheduleTitle, events]);

  useEffect(() => {
    const elapsed = performance.now() - (window.__LOAD_START__ ?? performance.now());
    const delay = Math.max(0, 600 - elapsed);
    const fadeTimer = setTimeout(() => {
      const el = document.getElementById("loading-screen");
      if (el) el.classList.add("leaving");
    }, delay);
    const removeTimer = setTimeout(() => {
      document.getElementById("loading-screen")?.remove();
    }, delay + 350);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    const encoded = extractShareHash(window.location.hash);
    if (!encoded || shareRestored.current) return;
    shareRestored.current = true;
    void (async () => {
      try {
        const data = parseSharePayload(await decodeShareData(encoded));
        setEvents(data.events);
        setScheduleTitle(data.title);
        if (data.themeFamily && data.themeMode) {
          const family = data.themeFamily as ThemeFamily;
          const mode = data.themeMode as ThemeMode;
          if (family in THEMES && mode in THEMES[family]) {
            setThemeFamily(family);
            setThemeMode(mode);
            document.documentElement.dataset.theme = THEMES[family][mode] ?? "";
          }
        }
        const { origin, pathname, search } = window.location;
        history.replaceState(null, "", `${origin}${pathname}${search}`);
      } catch {
        shareRestored.current = false;
      }
    })();
  }, []);

  useEffect(() => {
    function hasFiles(e: DragEvent) {
      return Array.from(e.dataTransfer?.types ?? []).includes("Files");
    }

    function handleDragEnter(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current += 1;
      setDragActive(true);
    }

    function handleDragOver(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
    }

    function handleDragLeave(e: DragEvent) {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragActive(false);
    }

    function handleDrop(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragActive(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) void importFromFile(file);
    }

    function handleDragEnd() {
      dragDepth.current = 0;
      setDragActive(false);
    }

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("dragend", handleDragEnd);
    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("dragend", handleDragEnd);
    };
  }, []);

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

  function handleNewSchedule() {
    setConfirmNewOpen(false);
    setEvents([]);
    setScheduleTitle("");
    resetColorIndex();
    setEditingId(null);
    setSheetView("list");
  }

  function handleNewClick() {
    if (events.length > 0 || scheduleTitle !== "") {
      setConfirmNewOpen(true);
    } else {
      handleNewSchedule();
    }
  }

  async function importFromFile(file: File) {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".png") && !name.endsWith(".pdf")) {
      setImportError("Only PNG and PDF files can be imported.");
      return;
    }
    let text: string;
    try {
      if (name.endsWith(".png")) {
        try {
          text = await extractSchedule(file);
        } catch {
          setImportError("This image does not contain an embedded schedule.");
          return;
        }
      } else {
        try {
          text = extractScheduleFromPDF(new Uint8Array(await file.arrayBuffer()));
        } catch {
          setImportError("This PDF does not contain an embedded schedule.");
          return;
        }
      }
      let data;
      try {
        data = parseTemplate(text);
      } catch {
        setImportError("The schedule data embedded in this file is not valid JSON.");
        return;
      }
      setEvents(data.events);
      setScheduleTitle(data.title ?? "");
    } catch {
      setImportError("Could not read the selected file.");
    }
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    void importFromFile(file);
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
          <button className="btn-new-schedule" onClick={handleNewClick}>
            New schedule
          </button>
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
          <a
            className="theme-toggle"
            href="https://github.com/flloisee/class-sched-maker"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
            </svg>
          </a>
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
          accept=".png,.pdf"
          ref={fileInputRef}
          onChange={handleImportFile}
          style={{ display: "none" }}
        />
        <button
          className="btn-import"
          onClick={() => fileInputRef.current?.click()}
        >
          Import PNG/PDF
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
                accept=".png,.pdf"
                ref={fileInputRef}
                onChange={handleImportFile}
                style={{ display: "none" }}
              />
              <button
                className="btn-import"
                onClick={() => fileInputRef.current?.click()}
              >
                Import PNG/PDF
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
        <WeeklySchedule events={events} onSelectEvent={handleSelectEvent} onAddNew={handleAddNew} onImport={() => fileInputRef.current?.click()} title={scheduleTitle} isDark={themeMode === "dark"} themeFamily={themeFamily} themeMode={themeMode} />
      </main>

      {confirmNewOpen && (
        <div className="modal-overlay" onClick={() => setConfirmNewOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create a new schedule?</h2>
            <p className="modal-subtitle">
              This will replace your current schedule and can't be undone.
            </p>
            <div className="modal-confirm-actions">
              <button className="modal-cancel" onClick={() => setConfirmNewOpen(false)}>
                Cancel
              </button>
              <button className="btn-new-confirm" onClick={handleNewSchedule}>
                New schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {importError && (
        <div className="modal-overlay" onClick={() => setImportError(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Import failed</h2>
            <p className="modal-subtitle">{importError}</p>
            <button className="modal-cancel" onClick={() => setImportError(null)}>
              OK
            </button>
          </div>
        </div>
      )}

      {dragActive && (
        <div className="drop-overlay">
          <div className="drop-overlay-card">
            Drop PNG/PDF to import
          </div>
        </div>
      )}
    </div>
  );
}
