import { state } from './state.js';
import { getStatusKey } from './status.js';

export async function loadSchema() {
  try {
    const response = await fetch('schema.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    state.schema = await response.json();
  } catch (error) {
    console.warn('Could not load schema.json:', error);
    state.schema = null;
  }
}

export async function loadData() {
  try {
    const dataUrl = state.config?.dataUrl || 'data.json';
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    state.allData = data.pathogens || [];
    console.log(`Data loaded: ${state.allData.length} pathogen entries`);

    if (state.allData.length === 0) {
      console.warn('No pathogen data found in data.json');
    }

    state.dataErrors = validateData(state.allData);
  } catch (error) {
    console.error('Error loading data:', error);
    state.allData = [];
    state.dataErrors = [`${error.message}`];
  }
}

export function buildCountryDataMap() {
  const countryData = {};

  state.allData.forEach((item) => {
    const country = item.country;
    if (!country) return;

    if (!countryData[country]) {
      countryData[country] = [];
    }
    countryData[country].push(item);
  });

  state.countryDataMap = countryData;
  console.log('Countries in data:', Object.keys(countryData));
}

export function getFilteredData(searchTerm = '') {
  let filtered = state.allData;

  if (state.filters.country !== 'all') {
    filtered = filtered.filter((item) => item.country === state.filters.country);
  }

  if (state.filters.disease !== 'all') {
    filtered = filtered.filter((item) => item.disease === state.filters.disease);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.location?.toLowerCase().includes(term) ||
        item.country?.toLowerCase().includes(term) ||
        item.disease?.toLowerCase().includes(term) ||
        item.notes?.toLowerCase().includes(term)
    );
  }

  return filtered;
}

function validateData(items) {
  if (!state.schema?.required) return [];

  const errors = [];
  items.forEach((item, index) => {
    state.schema.required.forEach((field) => {
      if (!item[field]) {
        errors.push(`Row ${index + 1} missing required field: ${field}`);
      }
    });

    if (item.transmissionStatus && !getStatusKey(item.transmissionStatus)) {
      errors.push(
        `Row ${index + 1} has unrecognized transmissionStatus: ${item.transmissionStatus}`
      );
    }
  });

  return errors;
}
