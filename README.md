# NYC Health + Hospitals Special Pathogens Biopreparedness Map

Official repository for the NYC Health + Hospitals System Biopreparedness Program’s Special Pathogens Biopreparedness Map.

**Live site:** https://biopreparednessmap.org

## Quick start

```bash
python3 -m http.server 8000
```

Open http://localhost:8000.

## Configuration

Default site and map settings live in `js/config.js`. `config.json` is optional override-only config. The map boundaries are stored in `assets/world.geojson`.

## Data updates

Edit `data.json`. Required fields: `disease`, `country`, `transmissionStatus`.

Valid `transmissionStatus` values:

- `Continued Transmission`
- `No Continued Transmission`
- `Endemic`

Validation rules are defined in `schema.json` and errors surface in the UI.

## Open source

- **Code license:** Apache-2.0 (`LICENSE`)
- **Data/content license:** CC BY 4.0 (`DATA_LICENSE.md`)
- **Branding:** NYC Health + Hospitals name/logos are trademarks and not covered by the licenses.

## Contributing

See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.

## Contact

SystemBiopreparedness@nychhc.org
