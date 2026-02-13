import { dom } from './dom.js';
import { state } from './state.js';
import { getFilteredData } from './data.js';
import { getStatusInfo, getStatusDefinitionMap } from './status.js';
import { updateMapCountries } from './map.js';

export function setupEventListeners() {
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
        window.open(e.target.value, '_blank');
        setTimeout(() => {
          e.target.value = '';
        }, 500);
      }
    });
  }
}

export function applyConfigToUI() {
  const config = state.config;
  if (!config) return;

  if (dom.siteTitle) dom.siteTitle.textContent = config.siteTitle || dom.siteTitle.textContent;
  if (dom.siteSubtitle) {
    dom.siteSubtitle.textContent = config.subtitle || dom.siteSubtitle.textContent;
  }
  if (dom.footerText) dom.footerText.textContent = config.footerText || dom.footerText.textContent;

  const definitions = getStatusDefinitionMap();
  if (definitions.continued && dom.legendContinuedLabel) {
    dom.legendContinuedLabel.textContent = definitions.continued.label;
  }
  if (definitions.noTransmission && dom.legendNoTransmissionLabel) {
    dom.legendNoTransmissionLabel.textContent = definitions.noTransmission.label;
  }
  if (definitions.endemic && dom.legendEndemicLabel) {
    dom.legendEndemicLabel.textContent = definitions.endemic.label;
  }

  setStatusCssVariables(definitions);
}

export function populateFilters() {
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

export function updateDataUpdateDate() {
  if (!dom.dataUpdateDate) return;
  const today = new Date();
  dom.dataUpdateDate.textContent = today.toISOString().split('T')[0];
}

export function updateDiseaseCount() {
  if (!dom.diseaseCount) return;
  const filtered = getFilteredData();
  const uniqueDiseases = new Set(filtered.map((item) => item.disease));
  dom.diseaseCount.textContent = uniqueDiseases.size;
}

export function updateLegendVisibility() {
  const hasContinued = state.allData.some(
    (item) => getStatusInfo(item.transmissionStatus).isContinued
  );
  const hasNoTransmission = state.allData.some(
    (item) => getStatusInfo(item.transmissionStatus).isNoTransmission
  );
  const hasEndemic = state.allData.some((item) => getStatusInfo(item.transmissionStatus).isEndemic);

  if (dom.legendContinued) {
    dom.legendContinued.style.display = hasContinued ? 'flex' : 'none';
  }
  if (dom.legendNoTransmission) {
    dom.legendNoTransmission.style.display = hasNoTransmission ? 'flex' : 'none';
  }
  if (dom.legendEndemic) {
    dom.legendEndemic.style.display = hasEndemic ? 'flex' : 'none';
  }
}

export function applyFilters() {
  updateLegendVisibility();
  updateMapCountries();
  updateDiseaseCount();
  updateDataErrorBanner();
}

export function updateDataErrorBanner() {
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

function setStatusCssVariables(definitions) {
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

function normalizeFilterValue(value) {
  const normalized = value.trim();
  if (!normalized || normalized.toLowerCase() === 'all') {
    return 'all';
  }
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
