import { initDom } from './dom.js';
import { loadData, buildCountryDataMap, loadSchema } from './data.js';
import { loadConfig } from './config-loader.js';
import { initializeMap, loadCountryBoundaries } from './map.js';
import {
  applyConfigToUI,
  applyFilters,
  initializeCasesSlider,
  populateFilters,
  setupEventListeners,
  updateDataUpdateDate,
} from './ui.js';

async function initApp() {
  initDom();
  await loadConfig();
  applyConfigToUI();
  await loadSchema();
  await loadData();
  buildCountryDataMap();
  initializeMap();
  initializeCasesSlider();
  setupEventListeners();
  populateFilters();
  updateDataUpdateDate();
  await loadCountryBoundaries();
  applyFilters();
}

document.addEventListener('DOMContentLoaded', initApp);
