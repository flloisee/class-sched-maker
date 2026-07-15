# AGENTS.md — class-sched-maker

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` (run both, never skip tsc) |
| `npm run lint` | `oxlint` |
| `npm run preview` | Serve built `dist/` locally |

No test framework, no formatter, no CI, no pre-commit hooks.

## TypeScript quirks

- **`erasableSyntaxOnly: true`** — no enums, no `namespace`, no constructor parameter properties. Use `const` objects or union types.
- **`verbatimModuleSyntax: true`** — `import type` for type-only imports.
- **`noUnusedLocals` / `noUnusedParameters`: both `true`** — dead code fails `tsc -b`.
- Root `tsconfig.json` has `"files": []` with project references (`tsconfig.app.json` + `tsconfig.node.json`). `tsc -b` builds both.

## Project structure

Single-page app (no router, no API, fully client-side). State in `<App>` via `useState`.

```
src/
  main.tsx              — entrypoint (StrictMode + createRoot)
  App.tsx               — root component, state owner, layout
  types.ts              — CalendarEvent, Day, DAYS const
  index.css             — global resets
  components/
    EventForm.tsx        — add/edit event form, uses crypto.randomUUID()
    EventList.tsx        — event list with delete
    WeeklySchedule.tsx   — 7-column weekly grid + greedy first-fit track layout
    PaperSizeModal.tsx   — PDF paper-size picker (letter/legal/A4)
  utils/
    time.ts              — parseTime, formatTime, formatTimeShort, computeTimeRange, getHourLabels, minutesSinceMidnight
    colors.ts            — cyclic 12-color palette (nextColor/resetColorIndex)
    export.ts            — PNG export (html2canvas) and PDF export (jspdf)
```

## Key conventions

- **Plain CSS** per component (`.css` files co-located). No CSS modules, Tailwind, or CSS-in-JS.
- **IDs**: `crypto.randomUUID()`. Never sequential or numeric.
- **Time format**: `"HH:MM"` 24-hour strings for `startTime`/`endTime`. Display uses `formatTimeShort` (12h with trimmed :00).
- **Days**: `["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]` — `Day` union type from `types.ts`.
- **Colors**: cyclical 12-color palette in `colors.ts`. Use `nextColor()` for default; `resetColorIndex()` to restart.
- **Export dependencies**: `html2canvas` (screenshots), `jspdf` (PDF). `exportAsPDF(element, format?, filename?)`.

## Linting

Only `oxlint`. Rules: `react/rules-of-hooks` (error), `react/only-export-components` (warn, with `allowConstantExport: true`). No ESLint or Prettier.
