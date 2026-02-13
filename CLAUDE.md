# CLAUDE.md

Project instructions for Claude Code when working on the Special Pathogens Biopreparedness Map.

## Project Overview

Interactive map tracking global disease outbreaks and endemic regions, developed for NYC Health + Hospitals System Biopreparedness Program.

**Live site:** https://biopreparednessmap.org

## Tech Stack

- **Frontend:** Vanilla JS + Tailwind CSS (CDN)
- **Map:** Leaflet.js (Carto basemap)
- **Hosting:** Cloudflare Pages
- **Repo:** github.com/SCTY-Inc/bio-map

## Key Files

| File          | Purpose                                 |
| ------------- | --------------------------------------- |
| `index.html`  | Main HTML structure, Tailwind classes   |
| `js/app.js`   | Entry point, state, data, UI, status    |
| `js/map.js`   | Leaflet map rendering, geo helpers      |
| `js/config.js` | Config, status definitions, country name map |
| `styles.css`  | Custom CSS, component styles            |
| `data.json`   | Pathogen/outbreak data (update monthly) |
| `updates/`    | Monthly outbreak list PDFs (source docs) |
| `assets/`     | Partner logos, H+H branding             |

## Monthly Data Update Workflow

Source: **Travel Screening Outbreak List PDF** (forwarded monthly by the team).

### Step 0 — Store the PDF

Save the PDF to `updates/` with naming convention: `YYYY-MM-outbreak-list.pdf` (e.g., `2026-02-outbreak-list.pdf`).

### Step 1 — Extract from PDF

Read the PDF and extract every disease, country, transmission status, and any notes (clade info, case counts, specific regions). Ask clarifying questions if:

- A country appears under multiple categories (e.g., DRC in both Clade 1a and 1b)
- A status is ambiguous (endemic country with active cases — classify as "Continued Transmission" or "Endemic"?)
- The disease list changed (diseases added or removed entirely)

### Step 2 — Diff against current data

Compare extracted list against current `data.json`:

- **Removed countries/diseases** — delete entries
- **New countries** — need `COUNTRY_NAME_MAP` entry in `js/config.js` (coordinates derived from GeoJSON automatically)
- **Status changes** — update `transmissionStatus`
- **Note changes** — update `notes` (clade info, case details)

### Step 3 — Update data.json

Entry schema (no `cases` or coordinate fields — centroids derived from GeoJSON at runtime):

```json
{
  "disease": "Mpox",
  "location": "Multiple regions",
  "country": "Uganda",
  "transmissionStatus": "Continued Transmission",
  "lastUpdated": "2026-02-11",
  "notes": "Clade 1b"
}
```

Set `lastUpdated` to the PDF date on all entries.

### Step 4 — Update config if needed

- New countries → add to `COUNTRY_NAME_MAP` in `js/config.js`
- Removed countries → remove stale entries from `COUNTRY_NAME_MAP`

### Step 5 — Validate

Run a count check: total entries, diseases, countries, statuses. Verify no dangling references.

### Known edge cases

| Issue | Resolution |
|-------|-----------|
| Country in multiple categories (e.g., DRC Clade 1a + 1b) | Keep higher-priority status ("Continued Transmission"), combine in notes |
| Country name doesn't match GeoJSON | Add variant to `COUNTRY_NAME_MAP` (check `assets/world.geojson` for exact name) |
| New country missing from map | Needs `COUNTRY_NAME_MAP` entry in `js/config.js` (country name must match GeoJSON) |
| PDF has case counts but data model dropped `cases` field | Put notable counts in `notes` text only |
| Disease name inconsistency (e.g., "Nipah" vs "Nipah Virus") | Use canonical name matching existing entries; if changing, update all entries |

### Canonical disease names

Use these exact strings in `data.json`:

- `Mpox`
- `Lassa Fever`
- `Nipah Virus`

If a new disease is added, establish the canonical name and document it here.

### Transmission statuses

- `Continued Transmission` — active outbreak (orange on map)
- `No Continued Transmission` — outbreak winding down (blue on map)
- `Endemic` — constant presence in region (green on map)

## Deployment

Push to `main` branch auto-deploys to Cloudflare Pages.

## Common Tasks

### Add new disease

1. Add entries to `data.json` using canonical name
2. Disease auto-populates in filter dropdown
3. Document canonical name in this file

### Add new country

1. Add to `data.json` (no coordinates needed — derived from GeoJSON)
2. Add to `COUNTRY_NAME_MAP` in `js/config.js` with any GeoJSON name variants

### Update partner logos

1. Add image to `assets/`
2. Update `index.html` partner section
