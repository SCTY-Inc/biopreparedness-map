export const DEFAULT_CONFIG = {
  siteTitle: 'Special Pathogens Biopreparedness Map',
  subtitle: 'Developed by NYC Health + Hospitals System Biopreparedness Program',
  footerText: '© 2026 NYC Health + Hospitals.',
  dataUrl: 'data.json',
  map: {
    center: [20, 15],
    zoom: 2,
    tileUrl: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    geojsonSources: ['assets/world.geojson'],
  },
  statusDefinitions: {
    continued: {
      label: 'Continued transmission',
      color: '#F28B46',
      className: 'continued-transmission',
      priority: 3,
      match: {
        includes: ['continued transmission'],
        excludes: ['no continued'],
      },
    },
    noTransmission: {
      label: 'No continued transmission',
      color: '#5078A1',
      className: 'no-transmission',
      priority: 2,
      match: {
        includes: ['no continued', 'no transmission'],
        excludes: [],
      },
    },
    endemic: {
      label: 'Endemic',
      color: '#86CC9F',
      className: 'endemic',
      priority: 1,
      match: {
        includes: ['endemic'],
        excludes: [],
      },
    },
  },
};

export const COUNTRY_NAME_MAP = {
  // Countries in current dataset
  'Democratic Republic of the Congo': [
    'Democratic Republic of the Congo',
    'DR Congo',
    'Congo, Democratic Republic of',
    'Congo, the Democratic Republic of the',
    'Democratic Republic of Congo',
  ],
  Congo: ['Republic of the Congo', 'Congo', 'Congo, Republic of'],
  Tanzania: ['Tanzania', 'Tanzania, United Republic of'],
  Nigeria: ['Nigeria'],
  Spain: ['Spain'],
  Uganda: ['Uganda'],
  Zambia: ['Zambia'],
  Burundi: ['Burundi'],
  Kenya: ['Kenya'],
  Malawi: ['Malawi'],
  Mozambique: ['Mozambique'],
  Rwanda: ['Rwanda'],
  Bangladesh: ['Bangladesh'],
  Sudan: ['Sudan'],
  'South Sudan': ['South Sudan'],
  'South Africa': ['South Africa'],
  Madagascar: ['Madagascar'],
  France: ['France'],
  Cameroon: ['Cameroon'],
  'Central African Republic': ['Central African Republic'],
  // Common variations for other countries
  'United States': ['United States of America', 'United States', 'USA', 'U.S.A.', 'US'],
  'United Kingdom': ['United Kingdom', 'UK', 'U.K.', 'Great Britain'],
  'South Korea': ['South Korea', 'Korea, South', 'Korea, Republic of', 'Republic of Korea'],
  'North Korea': ['North Korea', 'Korea, North', "Korea, Democratic People's Republic of"],
  Myanmar: ['Myanmar', 'Burma'],
  Palestine: ['Palestine', 'Palestinian Territory'],
};
