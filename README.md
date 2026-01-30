# NYC Health + Hospitals Special Pathogens Biopreparedness Map

Official repository for the NYC Health + Hospitals System Biopreparedness Program’s Special Pathogens Biopreparedness Map.

**Live site:** https://biopreparednessmap.org

## Quick start

```bash
python3 -m http.server 8000
```

Open http://localhost:8000.

## Data updates

Edit `data.json`. Required fields: `disease`, `country`, `transmissionStatus`.

Valid `transmissionStatus` values:
- `Continued Transmission`
- `No Continued Transmission`
- `Endemic`

## Open source

- **Code license:** Apache-2.0 (`LICENSE`)
- **Data/content license:** CC BY 4.0 (`DATA_LICENSE.md`)
- **Branding:** NYC Health + Hospitals name/logos are trademarks and not covered by the licenses.

## Contributing

See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.

## Contact

SystemBiopreparedness@nychhc.org
