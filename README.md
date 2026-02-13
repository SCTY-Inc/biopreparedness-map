# NYC Health + Hospitals Special Pathogens Biopreparedness Map

Official repository for the NYC Health + Hospitals System Biopreparedness Program’s Special Pathogens Biopreparedness Map.

**Live site:** https://biopreparednessmap.org

## Quick start

```bash
python3 -m http.server 8000
```

Open http://localhost:8000.

## Configuration

Site and map settings live in `js/config.js`. Country boundaries are in `assets/world.geojson`.

## Data updates

Edit `data.json`. Required fields: `disease`, `country`, `transmissionStatus`.

Country coordinates are derived automatically from `assets/world.geojson` at runtime — no lat/lng needed in data entries.

Valid `transmissionStatus` values:

| Status | Color | Meaning | Rule |
|--------|-------|---------|------|
| `Continued Transmission` | Orange | Active, time-bound outbreak or case event | Entry was added/kept because of specific recent cases. Could be removed next month if cases stop. |
| `No Continued Transmission` | Blue | Outbreak winding down | Previously active outbreak with declining/no new cases. |
| `Endemic` | Green | Disease permanently circulating in region | Entry would appear every month regardless of case counts. Baseline presence, not a new event. |

**Classification rule:** If a country was added because of a specific active outbreak or case event, use `Continued Transmission`. If the disease is always present in that region as a permanent baseline, use `Endemic`. Source: the monthly Travel Screening Outbreak List PDF, which marks endemic countries with `**` and active transmission with `*`.

Validation is handled in the UI.

## Open source

- **Code license:** Apache-2.0 (`LICENSE`)
- **Data/content license:** CC BY 4.0 (`DATA_LICENSE.md`)
- **Branding:** NYC Health + Hospitals name/logos are trademarks and not covered by the licenses.

## Contributing

See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.

## Contact

SystemBiopreparedness@nychhc.org
