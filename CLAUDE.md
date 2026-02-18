# CLAUDE.md

Special Pathogens Biopreparedness Map — NYC Health + Hospitals System Biopreparedness Program.

**Live:** https://biopreparednessmap.org | **Repo:** github.com/SCTY-Inc/biopreparedness-map | **Deploy:** push to `main` → Cloudflare Pages

## Key Files

| File | Purpose |
|------|---------|
| `data.json` | All pathogen/outbreak data (update monthly) |
| `js/config.js` | Status definitions, `COUNTRY_NAME_MAP` |
| `js/app.js` | Entry point, state, UI |
| `js/map.js` | Leaflet map rendering |
| `validate.js` | Pre-commit validation |

## Monthly Data Update

Source: **Travel Screening Outbreak List** — shared as a Google Sheet link with `agent@scty.org` (viewer access).

### Step 1 — Read the spreadsheet

```bash
GOG_KEYRING_PASSWORD=min gog sheets read "<spreadsheetId>" "Sheet1!A1:Z200" -a agent@scty.org
```

Extract the spreadsheet ID from the URL: `docs.google.com/spreadsheets/d/<THIS_PART>/edit`

The sheet has 3 sections:
- **Continued Transmission** — active outbreaks
- **No Continued Transmission** — winding down
- **Endemic Special Pathogen Diseases** — baseline endemic presence

### Step 2 — Rebuild data.json from scratch

**FULL REPLACE every time.** The spreadsheet is the source of truth. Do NOT diff/patch the old file.

Entry schema — NO `latitude`, `longitude`, or `cases` fields (centroids derived from GeoJSON at runtime):

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

**Disease names** — use these exact canonical strings:

| Spreadsheet name | data.json name |
|-----------------|----------------|
| Mpox Clade 1a / Mpox Clade 1b | `Mpox` |
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
cd ~/scty-repos/biopreparedness-map && node validate.js
```

Must pass with 0 errors before committing. If a country fails GeoJSON resolution, add it to `COUNTRY_NAME_MAP` in `js/config.js`.

### Step 5 — Commit and push

```bash
git add data.json js/config.js
git commit -m "Update data.json to <Month Year> outbreak list"
git push
```

Auto-deploys to Cloudflare Pages.

### Edge cases

| Issue | Resolution |
|-------|-----------|
| Country in multiple categories | One entry, highest-priority status, combine in notes |
| Country name not in GeoJSON | Add to `COUNTRY_NAME_MAP` in `js/config.js` |
| "Congo" vs "Republic of the Congo" | Use `Congo` in data.json (resolves via COUNTRY_NAME_MAP) |
| "Côte d'Ivoire" encoding | Use the exact UTF-8 string `Côte d'Ivoire` with curly apostrophe — check with validate.js |
| Spreadsheet has case counts | Ignore — do not add to data.json |
| New disease not in canonical table | Use Title Case, add to table above, commit CLAUDE.md too |
