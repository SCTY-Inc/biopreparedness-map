import { initDom } from './ui.js';
import { loadData, buildCountryDataMap } from './data.js';
import { DEFAULT_CONFIG } from './config.js';
import { state } from './state.js';
import { initializeMap, loadCountryBoundaries } from './map.js';
import {
  applyConfigToUI,
  applyFilters,
  populateFilters,
  setupEventListeners,
  updateDataUpdateDate,
} from './ui.js';

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
