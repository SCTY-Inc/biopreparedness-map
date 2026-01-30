import { CASES_MIN, CASES_MAX } from './config.js';

export const state = {
  map: null,
  countriesLayerGroup: null,
  allData: [],
  geoData: null,
  countryDataMap: {},
  config: null,
  schema: null,
  dataErrors: [],
  filters: {
    country: 'all',
    disease: 'all',
    casesMin: CASES_MIN,
    casesMax: CASES_MAX,
    showOutbreaks: true,
    showEndemic: true,
  },
  table: {
    page: 1,
    rowsPerPage: 25,
  },
};
