import { initDom } from './dom.js';
import { loadData, buildCountryDataMap } from './data.js';
import { initializeMap, loadCountryBoundaries } from './map.js';
import {
    applyFilters,
    initializeCasesSlider,
    populateFilters,
    setupEventListeners,
    updateDataUpdateDate
} from './ui.js';

async function initApp() {
    initDom();
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
