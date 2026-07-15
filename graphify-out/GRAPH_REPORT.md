# Graph Report - /Volumes/flloiseeSSD/Dev Projects/Github/Repos/class-sched-maker  (2026-07-15)

## Corpus Check
- Corpus is ~2,119 words - fits in a single context window. You may not need a graph.

## Summary
- 125 nodes · 138 edges · 28 communities (8 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- TypeScript Compiler Options
- Dependencies and Build Tooling
- React Components
- Node Build Configuration
- UI and Utility Functions
- Linting Configuration
- Runtime Dependencies
- TypeScript Project References
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `compilerOptions` - 15 edges
3. `CalendarEvent` - 9 edges
4. `parseTime()` - 7 edges
5. `WeeklySchedule()` - 6 edges
6. `scripts` - 5 edges
7. `formatTimeShort()` - 5 edges
8. `computeTimeRange()` - 4 edges
9. `rules` - 3 edges
10. `EventForm()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `verbatimModuleSyntax: true` --rationale_for--> `verbatimModuleSyntax`  [EXTRACTED]
  AGENTS.md → tsconfig.app.json
- `noUnusedLocals: true` --rationale_for--> `noUnusedLocals`  [EXTRACTED]
  AGENTS.md → tsconfig.app.json
- `noUnusedParameters: true` --rationale_for--> `noUnusedParameters`  [EXTRACTED]
  AGENTS.md → tsconfig.app.json
- `erasableSyntaxOnly: true` --rationale_for--> `erasableSyntaxOnly`  [EXTRACTED]
  AGENTS.md → tsconfig.app.json
- `exportAsPDF()` --references--> `jspdf`  [EXTRACTED]
  src/utils/export.ts → package.json

## Import Cycles
- None detected.

## Communities (28 total, 20 thin omitted)

### Community 0 - "TypeScript Compiler Options"
Cohesion: 0.08
Nodes (23): erasableSyntaxOnly: true, noUnusedLocals: true, noUnusedParameters: true, verbatimModuleSyntax: true, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly (+15 more)

### Community 1 - "Dependencies and Build Tooling"
Cohesion: 0.11
Nodes (17): devDependencies, oxlint, @types/node, @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react (+9 more)

### Community 2 - "React Components"
Cohesion: 0.21
Nodes (10): App(), EventForm(), Props, Props, Props, CalendarEvent, Day, DAYS (+2 more)

### Community 3 - "Node Build Configuration"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 4 - "UI and Utility Functions"
Cohesion: 0.29
Nodes (9): EventList(), assignTracks(), WeeklySchedule(), exportAsPNG(), computeTimeRange(), formatTimeShort(), getHourLabels(), parseTime() (+1 more)

### Community 5 - "Linting Configuration"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 6 - "Runtime Dependencies"
Cohesion: 0.33
Nodes (6): dependencies, html2canvas, jspdf, react, react-dom, exportAsPDF()

## Knowledge Gaps
- **68 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+63 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `Dependencies and Build Tooling`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `exportAsPDF()` connect `Runtime Dependencies` to `UI and Utility Functions`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TypeScript Compiler Options` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Dependencies and Build Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Node Build Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._