# CLAUDE.md

Project instructions for Claude Code when working on the Special Pathogens Biopreparedness Map.

## Project Overview

Interactive map tracking global disease outbreaks and endemic regions, developed for NYC Health + Hospitals System Biopreparedness Program.

**Live site:** https://biopreparednessmap.org

## Tech Stack

- **Frontend:** Vanilla JS + Tailwind CSS (CDN)
- **Map:** Leaflet.js (Carto basemap)
- **Slider:** noUiSlider
- **Hosting:** Cloudflare Pages
- **Repo:** github.com/SCTY-Inc/bio-map

## Key Files

| File          | Purpose                                 |
| ------------- | --------------------------------------- |
| `index.html`  | Main HTML structure, Tailwind classes   |
| `app.js`      | Module entry point                      |
| `js/`         | Application logic modules               |
| `styles.css`  | Custom CSS, component styles            |
| `config.json` | Site + map configuration                |
| `schema.json` | Data validation rules                   |
| `data.json`   | Pathogen/outbreak data (update monthly) |
| `assets/`     | Partner logos, H+H branding             |

## Data Updates

Monthly data updates go in `data.json`. Structure:

```json
{
  "pathogens": [
    {
      "disease": "Mpox",
      "country": "Uganda",
      "location": "Multiple regions",
      "transmissionStatus": "Continued Transmission",
      "lastUpdated": "2024-12-08",
      "notes": "Clade 1b - 6000 cases",
      "cases": 6000
    }
  ]
}
```

**Transmission statuses:**

- `Continued Transmission` - Active outbreak (orange)
- `No Continued Transmission` - Outbreak winding down (blue)
- `Endemic` - Constant presence in region (green)

## Country Name Mapping

Country names must match GeoJSON. If a new country doesn't appear on map, add mapping in `js/config.js` under `COUNTRY_NAME_MAP`.

## Deployment

Push to `main` branch auto-deploys to Cloudflare Pages.

```bash
git add .
git commit -m "Update data for [month]"
git push
```

## Common Tasks

### Add new disease

1. Add entries to `data.json`
2. Disease will auto-populate in filter dropdown

### Add new country

1. Add to `data.json`
2. If not showing on map, add to `COUNTRY_NAME_MAP` in `js/config.js`

### Update partner logos

1. Add image to `assets/`
2. Update `index.html` partner section
