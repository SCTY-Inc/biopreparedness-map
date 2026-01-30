import { CASES_MIN, CASES_MAX } from './config.js';
import { dom } from './dom.js';
import { state } from './state.js';
import { getFilteredData } from './data.js';
import { getStatusClass, getStatusInfo } from './status.js';
import { updateMapCountries } from './map.js';

export function initializeCasesSlider() {
    if (!dom.casesSlider || typeof noUiSlider === 'undefined') return;

    noUiSlider.create(dom.casesSlider, {
        start: [CASES_MIN, CASES_MAX],
        connect: true,
        range: {
            min: CASES_MIN,
            max: CASES_MAX
        },
        step: 1,
        format: {
            to: value => Math.round(value),
            from: value => Number(value)
        }
    });

    dom.casesSlider.noUiSlider.on('update', values => {
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
    dom.navTabs.forEach(button => {
        button.addEventListener('click', e => {
            const tabName = e.target.dataset.tab;
            switchNavTab(tabName);
        });
    });

    dom.contentTabs.forEach(button => {
        button.addEventListener('click', e => {
            const contentName = e.target.dataset.content;
            switchContentTab(contentName);
        });
    });

    if (dom.countryFilter) {
        dom.countryFilter.addEventListener('change', e => {
            state.filters.country = e.target.value;
            applyFilters();
        });
    }

    if (dom.diseaseFilter) {
        dom.diseaseFilter.addEventListener('change', e => {
            state.filters.disease = e.target.value;
            applyFilters();
        });
    }

    if (dom.showOutbreaks) {
        dom.showOutbreaks.addEventListener('change', e => {
            state.filters.showOutbreaks = e.target.checked;
            updateLegendVisibility();
            updateMapCountries();
        });
    }

    if (dom.showEndemic) {
        dom.showEndemic.addEventListener('change', e => {
            state.filters.showEndemic = e.target.checked;
            updateLegendVisibility();
            updateMapCountries();
        });
    }

    if (dom.tableSearch) {
        dom.tableSearch.addEventListener('input', e => {
            renderTable(e.target.value);
        });
    }

    if (dom.exportCsv) {
        dom.exportCsv.addEventListener('click', exportToCSV);
    }

    if (dom.resourceSelect) {
        dom.resourceSelect.addEventListener('change', e => {
            if (e.target.value) {
                window.open(e.target.value, '_blank');
                setTimeout(() => {
                    e.target.value = '';
                }, 500);
            }
        });
    }
}

export function populateFilters() {
    populateSelect(dom.countryFilter, state.allData.map(item => item.country));
    populateSelect(dom.diseaseFilter, state.allData.map(item => item.disease));
}

function populateSelect(selectEl, values) {
    if (!selectEl) return;

    const uniqueValues = Array.from(new Set(values.filter(Boolean))).sort();
    while (selectEl.children.length > 1) {
        selectEl.removeChild(selectEl.lastChild);
    }

    uniqueValues.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        selectEl.appendChild(option);
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
    const uniqueDiseases = new Set(filtered.map(item => item.disease));
    dom.diseaseCount.textContent = uniqueDiseases.size;
}

export function updateLegendVisibility() {
    const hasContinued = state.allData.some(item => getStatusInfo(item.transmissionStatus).isContinued);
    const hasNoTransmission = state.allData.some(item => getStatusInfo(item.transmissionStatus).isNoTransmission);
    const hasEndemic = state.allData.some(item => getStatusInfo(item.transmissionStatus).isEndemic);

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
    renderTable();
}

export function renderTable(searchTerm = '') {
    if (!dom.tableBody) return;
    const filtered = getFilteredData(searchTerm);

    dom.tableBody.innerHTML = '';

    if (filtered.length === 0) {
        dom.tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No data available</td></tr>';
        return;
    }

    filtered.forEach(item => {
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
}

export function exportToCSV() {
    const filtered = getFilteredData();
    const headers = ['Disease', 'Location', 'Country', 'Transmission Status', 'Last Updated', 'Notes', 'Latitude', 'Longitude'];
    const rows = filtered.map(item => [
        item.disease || '',
        item.location || '',
        item.country || '',
        item.transmissionStatus || '',
        item.lastUpdated || '',
        item.notes || '',
        item.latitude || '',
        item.longitude || ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');

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

function switchNavTab(tabName) {
    dom.navTabs.forEach(btn => btn.classList.remove('active'));
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
    dom.contentTabs.forEach(btn => btn.classList.remove('active'));
    const active = document.querySelector(`[data-content="${contentName}"]`);
    if (active) active.classList.add('active');

    dom.contentPanels.forEach(panel => panel.classList.remove('active'));
    const panel = document.getElementById(`${contentName}-content`);
    if (panel) panel.classList.add('active');

    if (contentName === 'map') {
        setTimeout(() => {
            if (state.map) state.map.invalidateSize();
        }, 100);
    }
}
