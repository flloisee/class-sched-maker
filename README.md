<div align="center">

# 🗓️ class-sched-maker

**Build weekly class & event schedules — no backend, no signup, just your browser.**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue?style=for-the-badge)](LICENSE) [![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev) [![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org) [![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev) [![Oxlint](https://img.shields.io/badge/lint-Oxlint-764ABC?style=for-the-badge)](https://oxc.rs)

</div>

---

## ✨ Features

| | |
|---|---|
| 🧩 **Multi-slot events** | One event, many times — lecture + lab + recitation in a single entry |
| 🎨 **Custom colors** | Pick, type a hex, or hit **Random** |
| 🕐 **24h in, 12h out** | Enter `09:00`, display shows `9:00 AM` |
| 📅 **Sun-first week** | Sunday → Saturday grid |
| 👯 **Overlap-aware grid** | Conflicting events sit side-by-side, never on top of each other |
| 🖼️ **Export PNG / PDF** | Letter, Legal, or A4 — with your theme baked in |
| 💾 **JSON templates** | Save a schedule, restore it anywhere |
| 🎭 **15 theme families** | × light/dark — Default, Ayu, GitHub, Dracula, Catppuccin, Nord, Solarized, Atom One, Tokyo Night, Gruvbox, Rosé Pine, Monokai, Everforest, Night Owl, Material |
| 📱 **Responsive** | Sidebar on desktop, bottom sheet on mobile |
| 🔒 **Zero backend** | Everything runs client-side in your browser |

---

## 🚀 Quick start

```sh
npm install     # install dependencies
npm run dev     # start dev server
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run lint` | Lint with Oxlint |
| `npm run preview` | Serve the production build locally |

---

## 🧭 Usage guide

### ➕ Adding events
1. Click **Events** in the bottom bar (or the sidebar on desktop) to open the event panel
2. Click **+ New** to create a new event
3. Fill in:
   - **Name** — required (e.g., "Math 101")
   - **Professor** — optional
   - **Time slots** — add one or more time ranges:
     - **Start/End** — 24-hour format (e.g., `09:00 – 10:30`)
     - **Days** — click day pills (Sun–Sat) to toggle; at least one day required
     - Click **+ Add time slot** for multi-slot events (e.g., lecture + lab)
   - **Color** — pick from the color picker, type a hex code, or click **Random**
4. Click **Add Event** (or **Save Changes** when editing)

### 🗂️ Managing events
- **Edit** — click an event in the list or on the schedule grid
- **Delete** — hover an event in the list and click the trash icon
- **Reorder** — events render in creation order; delete and re-add to change order

### 🎭 Themes
- Pick a family from the header dropdown — **15 families** in light & dark
- Click the sun/moon button to toggle **light/dark** within the current family
- Preference persists in `localStorage`

### ✏️ Schedule title
- Type in the header input to set a custom title (e.g., "Fall 2025 Schedule")
- The title appears atop the weekly grid and in exports

### 🖼️ Exporting
- **PNG** — click **Export PNG** → downloads `schedule.png`
- **PDF** — click **Export PDF** → pick Letter, Legal, or A4 → downloads `schedule.pdf`
- Exports capture the current theme (colors, background) and schedule title

### 💾 Templates (JSON)
- **Export Template** — sidebar → downloads `schedule-template.json` (title + all events)
- **Import Template** — pick a `.json` file → replaces the current schedule
- Templates are portable across browsers and devices

### ⌨️ Keyboard shortcuts
- `Escape` — close dropdowns, cancel editing, close bottom sheet
- `Tab` / `Shift+Tab` — navigate form fields
- `Enter` — submit forms

### 📱 Responsive layout
- **Desktop (≥768px)** — sidebar on the left, schedule on the right
- **Mobile (<768px)** — bottom sheet for events, full-width schedule; tap **Events** to open

### 🧠 Data persistence
- Events, theme, and title are **not** auto-saved to `localStorage` (by design)
- Use **Export Template** to save your work; **Import Template** to restore

### ⏰ Time format
- Input uses 24-hour format (`HH:MM`)
- Display uses 12-hour format with AM/PM (e.g., `9:00 AM`)

### 📆 Day order
- Week starts on **Sunday** (Sun, Mon, Tue, Wed, Thu, Fri, Sat)

---

## 🛠️ Tech stack

![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![Plain CSS](https://img.shields.io/badge/style-Plain_CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)

![useState](https://img.shields.io/badge/state-useState-FF8800?style=for-the-badge) ![html2canvas](https://img.shields.io/badge/export-PNG-2496ED?style=for-the-badge) ![jspdf](https://img.shields.io/badge/export-PDF-FF0000?style=for-the-badge) ![Oxlint](https://img.shields.io/badge/lint-Oxlint-764ABC?style=for-the-badge)

---

<div align="center">

*Built for personal use — if it helps you too, that's a win!* 🎉

</div>
