# Special Pathogens Biopreparedness Map

An interactive mapping tool for visualizing special pathogen outbreaks and biopreparedness data, recreated to match the original NYC Health + Hospitals design.

## Features

- **Interactive Map**: Leaflet.js-based map showing outbreak locations with color-coded markers
- **Advanced Filtering**: Filter by country, disease, and number of cases
- **Data Table**: Searchable table with all outbreak data
- **Easy Data Updates**: Update data via JSON or YAML file
- **Export Functionality**: Export filtered data to CSV
- **NYC Health + Hospitals Branding**: Matches original site design and colors

## Setup

1. Add your logo and assets to the `assets/` directory (see `assets/README.md`)

2. Serve the files using a local web server (required for loading JSON):
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   ```

3. Open `http://localhost:8000` in your browser

## Data Format

Update `data.json` with your pathogen data. Each entry should have:

```json
{
  "pathogens": [
    {
      "disease": "Disease Name",
      "location": "Specific Location",
      "country": "Country Name",
      "transmissionStatus": "Endemic | No Continued Transmission | Continued Transmission",
      "lastUpdated": "YYYY-MM-DD",
      "notes": "Additional notes",
      "latitude": 0.0,
      "longitude": 0.0
    }
  ]
}
```

### Transmission Status Values

- `Endemic`: Constant presence of disease in the area (Red marker)
- `No Continued Transmission`: Within second incubation period, no active cases (Orange marker)
- `Continued Transmission`: Ongoing transmission with active cases (Orange-red marker)

## YAML Support

You can also use YAML format. See `data.yaml.example` for the format, then convert using:

```bash
npm install  # First time only
npm run convert-yaml
```

## File Structure

```
path-map/
├── index.html          # Main HTML file
├── styles.css          # Styling (NYC Health + Hospitals branding)
├── app.js              # Application logic
├── data.json           # Pathogen data (update this file)
├── data.yaml.example   # Example YAML format
├── convert-yaml.js     # YAML to JSON converter
├── assets/             # Logo and partner images
│   └── README.md       # Asset specifications
└── README.md           # This file
```

## Layout

The site matches the original Shiny app layout:

- **Header**: Logo and title
- **Navigation**: Home and About tabs
- **Sidebar Filters**: Country, Disease, Number of Cases, Definitions, Partner logos
- **Main Content**: Map, Data Table, or Resources tabs
- **Brand Colors**: NYC Health + Hospitals blue (#0072BC) with professional healthcare styling

## Customization

- **Colors**: Brand colors are defined in CSS variables at the top of `styles.css`
- **Map Tiles**: Change the tile layer in `app.js` if you prefer different map tiles
- **Assets**: Add logos to `assets/` directory (see `assets/README.md`)

## Browser Support

Works in all modern browsers that support ES6+ and Leaflet.js.
