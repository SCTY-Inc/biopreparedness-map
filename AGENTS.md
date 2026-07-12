# Repository guide

Static NYC Health + Hospitals Special Pathogens Biopreparedness Map.

- Live: <https://biopreparednessmap.org>
- Deploy: Cloudflare Pages from `main`
- Verify: `npm run check`

## Structure

| Path | Purpose |
|---|---|
| `data.json` | Published pathogen and outbreak records |
| `js/data.js` | Data contract, filters, status helpers, validation |
| `js/app.js` | DOM and Leaflet rendering |
| `js/geo.js` | Country aliases and point overrides |
| `css/` | Tailwind input, site styles, and generated CSS |
| `assets/world.geojson` | Required country boundaries |
| `assets/logos/` | Header and partner logos |
| `sources/<year>/` | Archived authoritative source documents |
| `tests/` | Data, geography, and static-page tests |
| `validate.js` | CLI data validation |

## Data updates

The final Travel Screening Outbreak List is authoritative. It may arrive as a Google Sheet, email, or PDF. Replace the dataset from that source; do not preserve older records absent from the final list.

For Sheets:

```bash
gws-account agent sheets spreadsheets values get --params '{"spreadsheetId":"<id>","range":"Sheet1!A1:Z200"}'
```

Sections map to these exact statuses:

- `Continued Transmission`
- `No Continued Transmission`
- `Endemic`

Each entry must contain only:

```json
{
  "disease": "Mpox Clade Ib",
  "location": "Multiple regions",
  "country": "Uganda",
  "transmissionStatus": "Continued Transmission",
  "lastUpdated": "2026-07-12",
  "notes": "Clade 1b",
  "reference": "https://worldhealthorg.shinyapps.io/mpx_global/"
}
```

Rules:

- Use a canonical disease from `CANONICAL_DISEASES` in `js/data.js`. Add new names there and document their source-name mapping below.
- Treat `Mpox Clade Ia` and `Mpox Clade Ib` as separate diseases.
- Keep one entry per country+disease. If the source lists the same pair in multiple statuses, keep the highest priority: Continued Transmission, No Continued Transmission, Endemic.
- Use `Clade 1a`, `Clade 1b`, or `Clade 1a + 1b` for active Mpox notes. Use `Endemic region` or the named region for endemic notes.
- Omit case counts; they become stale.
- Use `Multiple regions` unless the source names a narrower location.
- Use an HTTPS reference.
- Set the same current `lastUpdated` date on every entry.

Non-obvious source mappings:

| Source name | Canonical name |
|---|---|
| Mpox Clade 1a | `Mpox Clade Ia` |
| Mpox Clade 1b | `Mpox Clade Ib` |
| Crimean-Congo hemorrhagic fever (CCHF) | `Crimean-Congo Hemorrhagic Fever` |
| Sudan virus (SUDV) | `Sudan Virus` |
| Bundibugyo virus (BDBV) | `Bundibugyo Virus` |
| Taï Forest virus (TAFV) | `Taï Forest Virus` |
| Ravn virus (RAVN) | `Ravn Virus` |
| Severe Fever with Thrombocytopenia Syndrome | `Severe Fever with Thrombocytopenia Syndrome (SFTS)` |
| Andes Virus (hantavirus) | `Andes Virus` |
| Avian Influenza A(H5N1) | `Avian Influenza, H5N1` |
| Avian Influenza A(H9N2) | `Avian Influenza, H9N2` |

## Geography

- Use canonical country names. Notable forms: `Congo`, `Côte d'Ivoire`, `Türkiye`, `South Korea`.
- Add spelling variants to `COUNTRY_NAME_MAP` in `js/geo.js`.
- Add a point override for microstates missing from GeoJSON and named subnational endemic regions.
- Country polygons use the highest visible status color, while popups retain all distinct disease entries.
- Do not add latitude or longitude to `data.json`.

## Invariants

- “Active Outbreak Diseases” counts distinct diseases with `Continued Transmission` only.
- `assets/world.geojson` is required. Do not add a centroid fallback.
- Browser and CLI validation must stay equivalent.
- Treat `css/tailwind.css` as generated output. Edit `css/tailwind.input.css`, site styles, or utility classes, then rebuild it.
- Keep `.claude/` ignored; its local symlink breaks Cloudflare Pages builds if committed.

## Verification

- `npm run check` builds CSS, validates data, and runs Node and static-page tests. Run it after code or data changes.
- After map, layout, or interaction changes, use `dev-browser` to smoke-test the local site at desktop and mobile viewport sizes.
