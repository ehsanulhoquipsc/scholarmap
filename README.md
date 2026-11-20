# ScholarMap — frontend prototype

A private research workspace for exploring universities, academic programs and
government/university scholarships around the world. **Design & prototyping phase
only** — no backend, auth, APIs or database. All data is local sample data; your
edits persist in the browser's `localStorage`.

## Run locally

```bash
cd scholarmap
npm install
npm run dev -- --port 3100
```

Open http://localhost:3100. To restore the original sample data, use
**Settings → Reset sample data**.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Overview — world map dashboard, stats, upcoming deadlines, your countries, recent notes |
| `/explore` | Explore World — full-height map with a country preview panel |
| `/countries` | Country index (researched / favourites / all 250) |
| `/countries/[code]` | Country workspace — Overview, Universities, Programs, Scholarships, Admission Requirements, Notes |
| `/universities`, `/universities/[id]` | University list and profile (with its programs and notes) |
| `/programs`, `/programs/[id]` | Program database (sortable table + filters) and program page |
| `/scholarships`, `/scholarships/[id]` | Scholarship discovery and scholarship page |
| `/compare` | Side-by-side comparison of up to three scholarships or programs |
| `/applications` | Application tracker — list and drag-and-drop board, checklist progress, linked documents, CSV export |
| `/calendar` | Month calendar of application, scholarship and program dates; `.ics` export (all or per item) with reminders |
| `/documents` | Document library — CVs, statements, certificates with versions; linked to application checklists |
| `/notes` | Research notebook with autosave, categories and links |
| `/settings` | Theme (light/dark/system), reset data |

## Interaction notes

- **Peek panel** — clicking a scholarship, program or university in a list opens it in a side
  panel (your place and filters stay put). Ctrl/⌘-click or "Open full page" opens the full page.
- **Undo** — deleting notes, documents, versions, applications, checklist items, or removing
  saved/compared items shows a toast with Undo instead of a confirmation dialog.
- **Provenance** — records show "Sample data", "Sample · edited by you 2 min ago" or
  "Added by you"; lists mark edited/your own records.
- **Mobile** — bottom tab bar (Overview, Explore, Applications, Calendar, More); the map has a
  full-screen mode and pinch zoom.

## Structure

```
src/
  app/                    routes (App Router)
  components/
    layout/               AppShell (sidebar, top bar), GlobalSearch (Ctrl/⌘ K), nav config
    map/                  WorldMap (d3-geo SVG, zoom/pan/pinch), CountrySearch
    ui/primitives.tsx     Button, Input, Select, Modal, Dropdown, Tabs, Badge, Flag, EmptyState…
    views/                Reusable browsers (University/Program/Scholarship), FilterBar,
                          CountryWorkspace, LinkedNotes, details/*
    forms/RecordForms.tsx Add/edit forms for every record type
  data/                   Sample countries, universities, programs, scholarships, workspace
  lib/                    types, store (React context + localStorage), derived stats/calendar events,
                          export.ts (CSV + iCalendar downloads), utils
public/geo/               world-atlas 1:50m TopoJSON (loaded at runtime)
```

## Design system (summary)

- **Colour tokens** in `src/app/globals.css` (`--bg`, `--bg-subtle`, `--fg`, `--fg-muted`,
  `--line`, `--accent`…) mapped to Tailwind utilities (`bg-subtle`, `text-fg-muted`,
  `border-line`, `text-accent`). Dark theme redefines the same tokens under
  `[data-theme="dark"]`.
- **Type**: Geist; weights 400/500 only. Scale classes `t-display`, `t-h1`, `t-h2`,
  `t-eyebrow`. Tabular numerals for figures.
- **Shape**: 6px controls, 8–12px panels, 1px hairlines; shadows only on floating layers.
- **Accent blue** reserved for selection, primary actions, active nav and saved state.

Sample figures are illustrative — verify on official sites before relying on them.
