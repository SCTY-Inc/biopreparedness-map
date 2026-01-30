# Contributing

Thank you for helping improve the NYC Health + Hospitals Special Pathogens Biopreparedness Map. This project is a static site, so contributions are lightweight and easy to review.

## Getting started

1. Fork the repo and create a feature branch.
2. Serve the site locally:
   ```bash
   python3 -m http.server 8000
   ```
3. Open http://localhost:8000 in your browser to validate changes.

## Data updates

If you are updating outbreak data:

- Edit `data.json` only.
- Required fields: `disease`, `country`, `transmissionStatus`.
- Valid `transmissionStatus` values: `Continued Transmission`, `No Continued Transmission`, `Endemic`.
- Run validation by loading the site; schema rules live in `schema.json`.
- Ensure country names match the GeoJSON or add a mapping in `js/config.js` under `COUNTRY_NAME_MAP`.

## Code changes

- Keep the map tile provider and attribution unchanged unless explicitly requested (see `config.json`).
- Preserve NYC Health + Hospitals branding and partner logos.
- Avoid removing existing data entries without approval from the maintainers.

## Testing checklist

- Map loads without console errors
- All countries in `data.json` appear on the map
- Filters work (country, disease, case slider)
- Toggle checkboxes show/hide correctly
- Popups display on country click
- Data table shows filtered results

## Pull requests

- Describe what changed and why.
- Include screenshots for UI changes.
- Link to any supporting data sources for data updates.

## Contact

For questions, email SystemBiopreparedness@nychhc.org.
