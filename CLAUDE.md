# CLAUDE.md

Special Pathogens Biopreparedness Map — NYC Health + Hospitals System Biopreparedness Program.

**Live:** https://biopreparednessmap.org | **Repo:** github.com/SCTY-Inc/biopreparedness-map | **Deploy:** push to `main` → Cloudflare Pages

## Key Files

| File | Purpose |
|------|---------|
| `data.json` | All pathogen/outbreak data (update monthly) |
| `js/data.js` | Shared config, status/filter helpers, validation |
| `js/app.js` | App entry point, UI, and Leaflet rendering |
| `js/geo.js` | Country aliases and point overrides |
| `validate.js` | Pre-commit validation |

## Monthly Data Update

Source: **Travel Screening Outbreak List** — sometimes shared as a Google Sheet link, sometimes as a forwarded email/PDF with a final authoritative country list.

### Step 1 — Read the spreadsheet

```bash
gws-account agent sheets spreadsheets values get --params '{"spreadsheetId":"<spreadsheetId>","range":"Sheet1!A1:Z200"}'
```

Extract the spreadsheet ID from the URL: `docs.google.com/spreadsheets/d/<THIS_PART>/edit`

The sheet has 3 sections:
- **Continued Transmission** — active outbreaks
- **No Continued Transmission** — winding down
- **Endemic Special Pathogen Diseases** — baseline endemic presence

### Step 2 — Rebuild data.json from scratch

**FULL REPLACE every time.** The final authoritative list is the source of truth, whether it comes from the spreadsheet or a later confirmation email/PDF. Do NOT preserve older countries just because they were previously live.

Entry schema — NO `latitude`, `longitude`, or `cases` fields (map geometry comes from country polygons plus `js/geo.js` point overrides at runtime):

```json
{
  "disease": "Mpox",
  "location": "Multiple regions",
  "country": "Uganda",
  "transmissionStatus": "Continued Transmission",
  "lastUpdated": "2026-02-18",
  "notes": "Clade 1b"
}
```

### Step 3 — Apply these rules (MANDATORY)

If the final source says "only these countries," treat that as authoritative and derive the live-site delta from that exact set.

**Disease names** — use these exact canonical strings:

| Spreadsheet name | data.json name |
|-----------------|----------------|
| Mpox Clade 1a / Mpox Clade 1b | `Mpox Clade I` |
| Lassa Fever / Lassa fever | `Lassa Fever` |
| Nipah Virus / Nipah virus | `Nipah Virus` |
| Crimean-Congo hemorrhagic fever (CCHF) | `Crimean-Congo Hemorrhagic Fever` |
| MERS | `MERS` |
| Ebola | `Ebola` |
| Marburg | `Marburg` |
| Sudan virus (SUDV) | `Sudan Virus` |
| Bundibugyo virus (BDBV) | `Bundibugyo Virus` |
| Taï Forest virus (TAFV) | `Taï Forest Virus` |
| Ravn virus (RAVN) | `Ravn Virus` |
| Lujo virus | `Lujo Virus` |
| Junin virus | `Junin Virus` |
| Chapare virus | `Chapare Virus` |
| Sabia virus | `Sabia Virus` |
| Machupo virus | `Machupo Virus` |
| Guanarito virus | `Guanarito Virus` |
| Alkhurma hemorrhagic fever virus | `Alkhurma Hemorrhagic Fever Virus` |
| Kyasanur Forest Disease virus | `Kyasanur Forest Disease Virus` |
| Omsk Hemorrhagic Fever virus | `Omsk Hemorrhagic Fever Virus` |
| Severe Fever with Thrombocytopenia Syndrome (SFTS) | `Severe Fever with Thrombocytopenia Syndrome (SFTS)` |
| Andes Virus (hantavirus) | `Andes Virus` |

New disease? Use Title Case, add to this table.

**Transmission statuses** — only these 3 values:

| Value | Meaning | Map color |
|-------|---------|-----------|
| `Continued Transmission` | Active outbreak | Orange |
| `No Continued Transmission` | Winding down | Blue |
| `Endemic` | Baseline presence | Green |

**Duplicate resolution** — a country+disease can only appear ONCE:

- If a country appears in both "Continued Transmission" AND "Endemic" sections → use `Continued Transmission` (higher priority)
- If Mpox appears under both Clade 1a and 1b for same country → one entry, notes = `Clade 1a + 1b`

**Notes field:**

- Mpox Continued Transmission: use `Clade 1b`, `Clade 1a`, or `Clade 1a + 1b`
- Endemic entries: use `Endemic region` (or specific location like `Western Siberia`)
- Do NOT put case counts in notes (they go stale)

**lastUpdated:** set to today's date on ALL entries.

**location field:** use `Multiple regions` unless source specifies (e.g., `Karnataka State`, `Western Siberia`, `Chapare region`).

### Step 4 — Validate

```bash
cd ~/scty-repos/bio-map && node validate.js
```

Must pass with 0 errors before committing. If a country fails GeoJSON resolution, add it to `COUNTRY_NAME_MAP` in `js/geo.js`.

### Step 5 — Commit and push

```bash
git add data.json js/geo.js
git commit -m "Update data.json to <Month Year> outbreak list"
git push
```

Auto-deploys to Cloudflare Pages.

### Edge cases

| Issue | Resolution |
|-------|-----------|
| Country in multiple categories | One entry, highest-priority status, combine in notes |
| Country name not in GeoJSON | Add alias handling or a point override in `js/geo.js` |
| "Congo" vs "Republic of the Congo" | Use `Congo` in data.json (resolves via COUNTRY_NAME_MAP) |
| "Côte d'Ivoire" encoding | Use the exact UTF-8 string `Côte d'Ivoire` with curly apostrophe — check with validate.js |
| Spreadsheet has case counts | Ignore — do not add to data.json |
| New disease not in canonical table | Use Title Case, add to table above, commit CLAUDE.md too |
| Microstate or regional endemic zone | Add a point override in `js/geo.js` so it renders on the map |

## Known Gotchas (learned the hard way)

### `.claude/` is gitignored — keep it that way

`.claude/skills` is a local symlink that breaks Cloudflare Pages builds if committed. It's in `.gitignore` — don't remove it.

### "Active Outbreak Diseases" counter counts CT only

The stat widget on the map shows **"Active Outbreak Diseases"** — it counts only diseases with `Continued Transmission` status, not all 20 tracked diseases. This is intentional per Syra Madad's spec (Feb 2026). Do not change it to count all diseases.

Example: if Mpox, Lassa Fever, and Nipah Virus are the only active outbreaks, the counter shows **3**, not 20.

### Map color priority

A country that appears in both Endemic and Continued Transmission in the spreadsheet shows **orange** (CT takes priority). Its endemic status is still in `data.json` and visible in the country popup. Do not remove the endemic entry to "fix" the color — that would be wrong.

### Mixed geometry support

The map now supports a mixed geometry model:

- Country polygons for country-wide statuses
- Point overrides in `js/geo.js` for microstates and regional endemic zones

Examples: `Singapore`, `Russia - Southern endemic foci`, `China - Northwestern/Xinjiang`.

### Runtime validation matches CLI validation

The browser now uses the same validation rules as `validate.js` for required fields, status values, canonical country names, GeoJSON resolvability, point-geometry coverage, duplicate country+disease pairs, and uniform `lastUpdated`. If `data.json` is malformed, the UI will show an issue banner instead of quietly rendering a wrong map.

### Country boundaries are required

`assets/world.geojson` is now a hard dependency for outbreak rendering. If boundary loading fails, the app shows an issue banner and does not attempt a fake centroid-marker fallback. Fix the boundary asset or path instead of trying to patch around it in `data.json`.

### `lastUpdated` must be uniform

`validate.js` now fails if `data.json` contains multiple `lastUpdated` dates. A monthly refresh is an all-file update, not a partial patch.
