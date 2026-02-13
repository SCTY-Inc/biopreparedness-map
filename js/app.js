import { DEFAULT_CONFIG, COUNTRY_NAME_MAP } from './config.js';
import { initializeMap, loadCountryBoundaries, updateMapCountries } from './map.js';

// --- State ---

export const state = {
  map: null,
  countriesLayerGroup: null,
  allData: [],
  geoData: null,
  countryDataMap: {},
  config: null,
  dataErrors: [],
  filters: {
    country: 'all',
    disease: 'all',
    showOutbreaks: true,
    showEndemic: true,
  },
};

// --- Status helpers ---

function normalizeStatus(status) {
  return (status || '').toLowerCase();
}

export function getStatusKey(status) {
  const normalized = normalizeStatus(status);
  const definitions = Object.entries(state.config?.statusDefinitions || {});

  for (const [key, definition] of definitions) {
    const includesMatch = definition.match?.includes?.some((term) => normalized.includes(term));
    const excludesMatch = definition.match?.excludes?.some((term) => normalized.includes(term));

    if (includesMatch && !excludesMatch) {
      return key;
    }
  }

  return null;
}

export function getStatusInfo(status) {
  const key = getStatusKey(status);
  return {
    key,
    isEndemic: key === 'endemic',
    isOutbreak: key === 'continued' || key === 'noTransmission',
    isContinued: key === 'continued',
    isNoTransmission: key === 'noTransmission',
  };
}

export function getStatusPriority(status) {
  const key = getStatusKey(status);
  const definitions = state.config?.statusDefinitions || {};
  return key ? definitions[key].priority : 0;
}

export function getStatusColor(status) {
  const key = getStatusKey(status);
  const definitions = state.config?.statusDefinitions || {};
  return key ? definitions[key].color : '#95a5a6';
}

// --- Data loading ---

const REQUIRED_FIELDS = ['disease', 'country', 'transmissionStatus'];

async function loadData() {
  try {
    const dataUrl = state.config?.dataUrl || 'data.json';
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    state.allData = data.pathogens || [];

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

function buildCountryDataMap() {
  const countryData = {};
  state.allData.forEach((item) => {
    const country = item.country;
    if (!country) return;
    if (!countryData[country]) countryData[country] = [];
    countryData[country].push(item);
  });
  state.countryDataMap = countryData;
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
  const errors = [];
  items.forEach((item, index) => {
    REQUIRED_FIELDS.forEach((field) => {
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

// --- DOM ---

let dom = {};

function initDom() {
  dom = {
    navTabs: document.querySelectorAll('.nav-tab'),
    contentTabs: document.querySelectorAll('.content-tab'),
    contentPanels: document.querySelectorAll('.content-panel'),
    homeTab: document.getElementById('home-tab'),
    aboutTab: document.getElementById('about-tab-content'),
    countryFilter: document.getElementById('country-filter'),
    diseaseFilter: document.getElementById('disease-filter'),
    countryOptions: document.getElementById('country-options'),
    diseaseOptions: document.getElementById('disease-options'),
    showOutbreaks: document.getElementById('show-outbreaks'),
    showEndemic: document.getElementById('show-endemic'),
    legendContinued: document.getElementById('legend-continued'),
    legendNoTransmission: document.getElementById('legend-no-transmission'),
    legendEndemic: document.getElementById('legend-endemic'),
    legendContinuedLabel: document.getElementById('legend-continued-label'),
    legendNoTransmissionLabel: document.getElementById('legend-no-transmission-label'),
    legendEndemicLabel: document.getElementById('legend-endemic-label'),
    dataUpdateDate: document.getElementById('data-update-date'),
    diseaseCount: document.getElementById('disease-count'),
    resourceSelect: document.getElementById('resource-select'),
    dataErrorBanner: document.getElementById('data-error-banner'),
    dataErrorMessage: document.getElementById('data-error-message'),
    siteTitle: document.getElementById('site-title'),
    siteSubtitle: document.getElementById('site-subtitle'),
    footerText: document.getElementById('footer-text'),
  };
}

// --- UI logic ---

function setupEventListeners() {
  dom.navTabs.forEach((button) => {
    button.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchNavTab(tabName);
    });
  });

  dom.contentTabs.forEach((button) => {
    button.addEventListener('click', (e) => {
      const contentName = e.target.dataset.content;
      switchContentTab(contentName);
    });
  });

  if (dom.countryFilter) {
    const handler = (e) => {
      state.filters.country = normalizeFilterValue(e.target.value);
      applyFilters();
    };
    dom.countryFilter.addEventListener('input', handler);
    dom.countryFilter.addEventListener('change', handler);
  }

  if (dom.diseaseFilter) {
    const handler = (e) => {
      state.filters.disease = normalizeFilterValue(e.target.value);
      applyFilters();
    };
    dom.diseaseFilter.addEventListener('input', handler);
    dom.diseaseFilter.addEventListener('change', handler);
  }

  if (dom.showOutbreaks) {
    dom.showOutbreaks.addEventListener('change', (e) => {
      state.filters.showOutbreaks = e.target.checked;
      updateLegendVisibility();
      updateMapCountries();
    });
  }

  if (dom.showEndemic) {
    dom.showEndemic.addEventListener('change', (e) => {
      state.filters.showEndemic = e.target.checked;
      updateLegendVisibility();
      updateMapCountries();
    });
  }

  if (dom.resourceSelect) {
    dom.resourceSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        window.open(e.target.value, '_blank', 'noopener');
        setTimeout(() => {
          e.target.value = '';
        }, 500);
      }
    });
  }
}

function applyConfigToUI() {
  const config = state.config;
  if (!config) return;

  if (dom.siteTitle) dom.siteTitle.textContent = config.siteTitle || dom.siteTitle.textContent;
  if (dom.siteSubtitle) {
    dom.siteSubtitle.textContent = config.subtitle || dom.siteSubtitle.textContent;
  }
  if (dom.footerText) dom.footerText.textContent = config.footerText || dom.footerText.textContent;

  const definitions = state.config?.statusDefinitions || {};
  if (definitions.continued && dom.legendContinuedLabel) {
    dom.legendContinuedLabel.textContent = definitions.continued.label;
  }
  if (definitions.noTransmission && dom.legendNoTransmissionLabel) {
    dom.legendNoTransmissionLabel.textContent = definitions.noTransmission.label;
  }
  if (definitions.endemic && dom.legendEndemicLabel) {
    dom.legendEndemicLabel.textContent = definitions.endemic.label;
  }

  const root = document.documentElement;
  if (definitions.continued?.color) {
    root.style.setProperty('--continued-transmission', definitions.continued.color);
  }
  if (definitions.noTransmission?.color) {
    root.style.setProperty('--no-transmission', definitions.noTransmission.color);
  }
  if (definitions.endemic?.color) {
    root.style.setProperty('--endemic', definitions.endemic.color);
  }
}

function populateFilters() {
  populateDatalist(
    dom.countryOptions,
    state.allData.map((item) => item.country)
  );
  populateDatalist(
    dom.diseaseOptions,
    state.allData.map((item) => item.disease)
  );

  if (dom.countryFilter) dom.countryFilter.value = '';
  if (dom.diseaseFilter) dom.diseaseFilter.value = '';
}

function populateDatalist(listEl, values) {
  if (!listEl) return;
  listEl.innerHTML = '';
  const uniqueValues = Array.from(new Set(values.filter(Boolean))).sort();
  uniqueValues.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    listEl.appendChild(option);
  });
}

function updateDataUpdateDate() {
  if (!dom.dataUpdateDate) return;

  const timestamps = state.allData
    .map((item) => Date.parse(item.lastUpdated))
    .filter((ts) => Number.isFinite(ts));

  if (timestamps.length > 0) {
    dom.dataUpdateDate.textContent = new Date(Math.max(...timestamps)).toISOString().slice(0, 10);
  } else {
    dom.dataUpdateDate.textContent = new Date().toISOString().split('T')[0];
  }
}

function updateDiseaseCount() {
  if (!dom.diseaseCount) return;
  const filtered = getFilteredData();
  const uniqueDiseases = new Set(filtered.map((item) => item.disease));
  dom.diseaseCount.textContent = uniqueDiseases.size;
}

function updateLegendVisibility() {
  const hasContinued = state.allData.some(
    (item) => getStatusInfo(item.transmissionStatus).isContinued
  );
  const hasNoTransmission = state.allData.some(
    (item) => getStatusInfo(item.transmissionStatus).isNoTransmission
  );
  const hasEndemic = state.allData.some((item) => getStatusInfo(item.transmissionStatus).isEndemic);

  if (dom.legendContinued) dom.legendContinued.style.display = hasContinued ? 'flex' : 'none';
  if (dom.legendNoTransmission) {
    dom.legendNoTransmission.style.display = hasNoTransmission ? 'flex' : 'none';
  }
  if (dom.legendEndemic) dom.legendEndemic.style.display = hasEndemic ? 'flex' : 'none';
}

function applyFilters() {
  updateLegendVisibility();
  updateMapCountries();
  updateDiseaseCount();
  updateDataErrorBanner();
}

function updateDataErrorBanner() {
  if (!dom.dataErrorBanner || !dom.dataErrorMessage) return;

  if (state.dataErrors.length === 0) {
    dom.dataErrorBanner.classList.add('hidden');
    dom.dataErrorMessage.textContent = '';
    return;
  }

  const preview = state.dataErrors.slice(0, 3).join(' • ');
  const more = state.dataErrors.length > 3 ? ` (+${state.dataErrors.length - 3} more)` : '';
  dom.dataErrorMessage.textContent = `${preview}${more}`;
  dom.dataErrorBanner.classList.remove('hidden');
}

function normalizeFilterValue(value) {
  const normalized = value.trim();
  if (!normalized || normalized.toLowerCase() === 'all') return 'all';
  return normalized;
}

function switchNavTab(tabName) {
  dom.navTabs.forEach((btn) => btn.classList.remove('active'));
  const active = document.querySelector(`[data-tab="${tabName}"]`);
  if (active) active.classList.add('active');

  if (tabName === 'home') {
    if (dom.homeTab) dom.homeTab.classList.add('active');
    if (dom.aboutTab) dom.aboutTab.classList.remove('active');
  } else if (tabName === 'about') {
    if (dom.homeTab) dom.homeTab.classList.remove('active');
    if (dom.aboutTab) dom.aboutTab.classList.add('active');
  }
}

function switchContentTab(contentName) {
  dom.contentTabs.forEach((btn) => btn.classList.remove('active'));
  const active = document.querySelector(`[data-content="${contentName}"]`);
  if (active) active.classList.add('active');

  dom.contentPanels.forEach((panel) => panel.classList.remove('active'));
  const panel = document.getElementById(`${contentName}-content`);
  if (panel) panel.classList.add('active');

  if (contentName === 'map') {
    setTimeout(() => {
      if (state.map) state.map.invalidateSize();
    }, 100);
  }
}

// --- Init ---

async function initApp() {
  initDom();
  state.config = DEFAULT_CONFIG;
  applyConfigToUI();
  await loadData();
  buildCountryDataMap();
  initializeMap();
  setupEventListeners();
  populateFilters();
  updateDataUpdateDate();
  await loadCountryBoundaries();
  applyFilters();
}

document.addEventListener('DOMContentLoaded', initApp);
