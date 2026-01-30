import { CASES_MIN, CASES_MAX } from './config.js';
import { dom } from './dom.js';
import { state } from './state.js';
import { getFilteredData } from './data.js';
import { getStatusClass, getStatusInfo, getStatusDefinitionMap } from './status.js';
import { updateMapCountries } from './map.js';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function initializeCasesSlider() {
  if (!dom.casesSlider || typeof noUiSlider === 'undefined') return;

  noUiSlider.create(dom.casesSlider, {
    start: [CASES_MIN, CASES_MAX],
    connect: true,
    range: {
      min: CASES_MIN,
      max: CASES_MAX,
    },
    step: 1,
    format: {
      to: (value) => Math.round(value),
      from: (value) => Number(value),
    },
  });

  dom.casesSlider.noUiSlider.on('update', (values) => {
    if (dom.casesMinInput) dom.casesMinInput.value = values[0];
    if (dom.casesMaxInput) dom.casesMaxInput.value = values[1];

    state.filters.casesMin = parseInt(values[0], 10);
    state.filters.casesMax = parseInt(values[1], 10);
  });

  dom.casesSlider.noUiSlider.on('change', () => {
    applyFilters();
  });

  if (dom.casesMinInput) {
    dom.casesMinInput.addEventListener('change', () => {
      dom.casesSlider.noUiSlider.set([dom.casesMinInput.value, null]);
    });
  }
  if (dom.casesMaxInput) {
    dom.casesMaxInput.addEventListener('change', () => {
      dom.casesSlider.noUiSlider.set([null, dom.casesMaxInput.value]);
    });
  }
}

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
      state.table.page = 1;
      applyFilters();
    };
    dom.countryFilter.addEventListener('input', handler);
    dom.countryFilter.addEventListener('change', handler);
  }

  if (dom.diseaseFilter) {
    const handler = (e) => {
      state.filters.disease = normalizeFilterValue(e.target.value);
      state.table.page = 1;
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

  if (dom.tableSearch) {
    dom.tableSearch.addEventListener('input', (e) => {
      state.table.page = 1;
      renderTable(e.target.value);
    });
  }

  if (dom.exportCsv) {
    dom.exportCsv.addEventListener('click', exportToCSV);
  }

  if (dom.rowsPerPageSelect) {
    dom.rowsPerPageSelect.addEventListener('change', (e) => {
      state.table.rowsPerPage = parseInt(e.target.value, 10);
      state.table.page = 1;
      renderTable(dom.tableSearch?.value || '');
    });
  }

  if (dom.pagePrev) {
    dom.pagePrev.addEventListener('click', () => {
      state.table.page = Math.max(1, state.table.page - 1);
      renderTable(dom.tableSearch?.value || '');
    });
  }

  if (dom.pageNext) {
    dom.pageNext.addEventListener('click', () => {
      state.table.page += 1;
      renderTable(dom.tableSearch?.value || '');
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
  setRowsPerPageOptions();
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
  renderTable(dom.tableSearch?.value || '');
  updateDataErrorBanner();
}

export function renderTable(searchTerm = '') {
  if (!dom.tableBody) return;
  const filtered = getFilteredData(searchTerm);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / state.table.rowsPerPage));
  if (state.table.page > totalPages) {
    state.table.page = totalPages;
  }

  const startIndex = (state.table.page - 1) * state.table.rowsPerPage;
  const pageItems = filtered.slice(startIndex, startIndex + state.table.rowsPerPage);

  dom.tableBody.innerHTML = '';

  if (pageItems.length === 0) {
    dom.tableBody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; padding: 20px;">No data available</td></tr>';
    updatePaginationControls(totalItems, totalPages, startIndex);
    return;
  }

  pageItems.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td>${item.disease || 'N/A'}</td>
            <td>${item.location || 'N/A'}</td>
            <td>${item.country || 'N/A'}</td>
            <td><span class="status-badge status-${getStatusClass(item.transmissionStatus)}">${item.transmissionStatus || 'N/A'}</span></td>
            <td>${item.lastUpdated || 'N/A'}</td>
            <td>${item.notes || 'N/A'}</td>
        `;
    dom.tableBody.appendChild(row);
  });

  updatePaginationControls(totalItems, totalPages, startIndex);
}

export function exportToCSV() {
  const filtered = getFilteredData();
  const headers = [
    'Disease',
    'Location',
    'Country',
    'Transmission Status',
    'Last Updated',
    'Notes',
    'Latitude',
    'Longitude',
  ];
  const rows = filtered.map((item) =>
    [
      item.disease || '',
      item.location || '',
      item.country || '',
      item.transmissionStatus || '',
      item.lastUpdated || '',
      item.notes || '',
      item.latitude || '',
      item.longitude || '',
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(',')
  );

  const csv = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `special-pathogens-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
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

function updatePaginationControls(totalItems, totalPages, startIndex) {
  if (dom.pageInfo) {
    const endIndex = Math.min(totalItems, startIndex + state.table.rowsPerPage);
    dom.pageInfo.textContent = `Showing ${totalItems === 0 ? 0 : startIndex + 1}-${endIndex} of ${totalItems}`;
  }

  if (dom.pageCount) {
    dom.pageCount.textContent = `Page ${state.table.page} of ${totalPages}`;
  }

  if (dom.pagePrev) {
    dom.pagePrev.disabled = state.table.page <= 1;
  }

  if (dom.pageNext) {
    dom.pageNext.disabled = state.table.page >= totalPages;
  }
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

function setRowsPerPageOptions() {
  if (!dom.rowsPerPageSelect) return;

  dom.rowsPerPageSelect.innerHTML = '';
  ROWS_PER_PAGE_OPTIONS.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = `${value} per page`;
    if (value === state.table.rowsPerPage) {
      option.selected = true;
    }
    dom.rowsPerPageSelect.appendChild(option);
  });
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
