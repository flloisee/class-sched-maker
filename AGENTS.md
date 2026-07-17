# AGENTS.md — class-sched-maker

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` (run both, never skip tsc) |
| `npm run lint` | `oxlint` (no ESLint/Prettier) |
| `npm run preview` | Serve built `dist/` locally |

No test framework, no formatter, no CI, no pre-commit hooks.

## TypeScript quirks

- **`erasableSyntaxOnly: true`** — no enums, no `namespace`, no constructor parameter properties. Use `const` objects or union types.
- **`verbatimModuleSyntax: true`** — `import type` for type-only imports.
- **`noUnusedLocals` / `noUnusedParameters`: both `true`** — dead code fails `tsc -b`.
- Root `tsconfig.json` has `"files": []` with project references (`tsconfig.app.json` + `tsconfig.node.json`). `tsc -b` builds both.
- TypeScript ~6.0.2.

## Architecture

Single-page app (no router, no API, fully client-side). State in `<App>` via `useState`.

```
src/
  main.tsx              — entrypoint (StrictMode + createRoot)
  App.tsx               — root component, state owner, theme toggle, schedule title, sidebar + bottom sheet layout
  types.ts              — CalendarEvent{id,name,slots,color}, TimeSlot{startTime,endTime,days}, DAYS, Day
  themes.css            — 10 themes (5 families × light/dark) via [data-theme] on <html>
  components/
    EventForm.tsx        — add/edit event, uses crypto.randomUUID()
    EventList.tsx        — event list with delete
    WeeklySchedule.tsx   — 7-column weekly grid + greedy first-fit track layout
    PaperSizeModal.tsx   — PDF paper-size picker (letter/legal/A4)
  utils/
    time.ts              — parseTime, formatTime, formatTimeShort, computeTimeRange, getHourLabels, minutesSinceMidnight
    colors.ts            — 8-color palette, nextColor/resetColorIndex, colorForTheme(hex,isDark) for dark mode
    export.ts            — PNG (html2canvas) and PDF (jspdf) export
    template.ts          — JSON schedule template export/import (exportAsTemplate, parseTemplateFile)
```

## Key conventions

- **Plain CSS** per component (`.css` co-located). No CSS modules, Tailwind, or CSS-in-JS.
- **IDs**: `crypto.randomUUID()`.
- **`CalendarEvent` has `slots: TimeSlot[]`** — each event can span multiple days/times. Never flat `startTime`/`endTime`/`days`.
- **DAYS**: `["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]` — Sunday is first.
- **Time format**: `"HH:MM"` 24h strings. Display uses `formatTimeShort` (12h, trims `:00`).
- **Colors**: cyclical 8-color palette in `colors.ts`. Use `nextColor()` for default; `colorForTheme(hex, isDark)` to adapt for dark mode.
- **Themes**: 5 families (default, ayu, github, dracula, catppuccin) × light/dark. Set via `data-theme` attribute on `<html>`.
- **Export**: `exportAsPNG(element, filename?)` and `exportAsPDF(element, format?, filename?)`. `format` is `"letter"` | `"legal"` | `"a4"`.
- **Template I/O**: `exportAsTemplate(events, title, filename?)` downloads JSON; `parseTemplateFile(file)` reads one back.
- **vite config**: `base: '/class-sched-maker/'` — relevant for deployment.

## Linting

`oxlint` only. Rules: `react/rules-of-hooks` (error), `react/only-export-components` (warn, `allowConstantExport: true`).
