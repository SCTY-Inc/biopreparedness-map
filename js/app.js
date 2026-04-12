import {
  DEFAULT_CONFIG,
  getGeoCountryName,
  getLatestUpdateDate,
  getLegendVisibility,
  getStatusColor,
  getStatusInfo,
  getStatusPriority,
  getVisibleItems,
  groupItemsByDisease,
  validateEntries,
} from './data.js';
import { findMatchingCountryName, getPointGeometryOverride, usesPointGeometry } from './geo.js';

const MAP_RESIZE_DELAY_MS = 100;

const state = {
  map: null,
  countriesLayerGroup: null,
  allData: [],
  geoData: null,
  dataLoadErrors: [],
  dataErrors: [],
  mapErrors: [],
  filters: {
    country: 'all',
    disease: 'all',
    showOutbreaks: true,
    showEndemic: true,
  },
  config: DEFAULT_CONFIG,
};

let dom = {};

function filterOverseasTerritories(feature) {
  if (!feature.geometry || feature.geometry.type !== 'MultiPolygon') {
    return feature;
  }

  const boundsByCountry = {
    France: { minLat: 41, maxLat: 52, minLng: -6, maxLng: 10 },
  };
  const countryBounds = boundsByCountry[getGeoCountryName(feature)];

  if (!countryBounds) {
    return feature;
  }

  const coordinates = feature.geometry.coordinates.filter((polygon) => {
    const ring = polygon[0];
    if (!ring?.length) {
      return true;
    }

    const avgLng = ring.reduce((sum, [lng]) => sum + lng, 0) / ring.length;
    const avgLat = ring.reduce((sum, [, lat]) => sum + lat, 0) / ring.length;

    return (
      avgLat >= countryBounds.minLat &&
      avgLat <= countryBounds.maxLat &&
      avgLng >= countryBounds.minLng &&
      avgLng <= countryBounds.maxLng
    );
  });

  return coordinates.length > 0
    ? {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates,
        },
      }
    : feature;
}

function getIssues() {
  return Array.from(new Set([...state.mapErrors, ...state.dataLoadErrors, ...state.dataErrors]));
}

function hasBlockingIssues() {
  return getIssues().length > 0;
}

function getRenderableItems() {
  return hasBlockingIssues() ? [] : getVisibleItems(state.config, state.allData, state.filters);
}

function initDom() {
  dom = {
    navTabs: document.querySelectorAll('.nav-tab'),
    contentTabs: document.querySelectorAll('.content-tab'),
    contentPanels: document.querySelectorAll('.content-panel'),
    homeTab: document.getElementById('home-tab'),
    aboutTab: document.getElementById('about-tab-content'),
    mapContent: document.getElementById('map-content'),
    countryFilter: document.getElementById('country-filter'),
    diseaseFilter: document.getElementById('disease-filter'),
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

function initializeMap() {
  const mapConfig = state.config.map;

  state.map = L.map('map', {
    zoomControl: true,
    attributionControl: true,
    minZoom: 2,
    maxZoom: 10,
  }).setView(mapConfig.center, mapConfig.zoom);

  L.tileLayer(mapConfig.tileUrl, {
    attribution: mapConfig.attribution,
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(state.map);

  state.map.getContainer().style.backgroundColor = '#D8DCDC';
  state.countriesLayerGroup = L.layerGroup().addTo(state.map);
}

async function loadData() {
  state.dataLoadErrors = [];

  try {
    const response = await fetch(state.config.dataUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    state.allData = data.pathogens || [];

    if (state.allData.length === 0) {
      console.warn('No pathogen data found in data.json');
    }
  } catch (error) {
    console.error('Error loading data:', error);
    state.allData = [];
    state.dataLoadErrors = [`Could not load outbreak data: ${error.message}`];
  }
}

async function loadCountryBoundaries() {
  state.mapErrors = [];

  let geoJson = null;
  let lastError = null;

  for (const source of state.config.map.geojsonSources || []) {
    try {
      const response = await fetch(source);
      if (!response.ok) {
        lastError = new Error(`${source} returned HTTP ${response.status}`);
        continue;
      }

      geoJson = await response.json();
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!Array.isArray(geoJson?.features)) {
    state.geoData = null;
    state.mapErrors = [
      `Could not load country boundaries. The map cannot render outbreak layers${lastError ? `: ${lastError.message}` : '.'}`,
    ];
    return;
  }

  state.geoData = {
    ...geoJson,
    features: geoJson.features.map(filterOverseasTerritories),
  };
}

function refreshValidation() {
  state.dataErrors = validateEntries(state.allData, {
    geoFeatures: state.geoData?.features,
  });

  updateDataUpdateDate();
  updateIssueBanner();
}

function invalidateMapSizeSoon() {
  if (!state.map || !dom.homeTab?.classList.contains('active') || !dom.mapContent?.classList.contains('active')) {
    return;
  }

  window.setTimeout(() => {
    if (state.map && dom.homeTab?.classList.contains('active') && dom.mapContent?.classList.contains('active')) {
      state.map.invalidateSize();
    }
  }, MAP_RESIZE_DELAY_MS);
}

function setupEventListeners() {
  dom.navTabs.forEach((button) => {
    button.addEventListener('click', (event) => {
      switchNavTab(event.currentTarget.dataset.tab);
    });
  });

  dom.contentTabs.forEach((button) => {
    button.addEventListener('click', (event) => {
      switchContentTab(event.currentTarget.dataset.content);
    });
  });

  dom.countryFilter?.addEventListener('change', (event) => {
    state.filters.country = event.target.value;
    applyFilters();
  });

  dom.diseaseFilter?.addEventListener('change', (event) => {
    state.filters.disease = event.target.value;
    applyFilters();
  });

  dom.showOutbreaks?.addEventListener('change', (event) => {
    state.filters.showOutbreaks = event.target.checked;
    applyFilters();
  });

  dom.showEndemic?.addEventListener('change', (event) => {
    state.filters.showEndemic = event.target.checked;
    applyFilters();
  });

  dom.resourceSelect?.addEventListener('change', (event) => {
    if (!event.target.value) {
      return;
    }

    window.open(event.target.value, '_blank', 'noopener');
    window.setTimeout(() => {
      event.target.value = '';
    }, 500);
  });
}

function applyConfigToUI() {
  const { statusDefinitions } = state.config;
  const root = document.documentElement;

  if (dom.siteTitle) {
    dom.siteTitle.textContent = state.config.siteTitle;
  }
  if (dom.siteSubtitle) {
    dom.siteSubtitle.textContent = state.config.subtitle;
  }
  if (dom.footerText) {
    dom.footerText.textContent = state.config.footerText;
  }
  if (dom.legendContinuedLabel) {
    dom.legendContinuedLabel.textContent = statusDefinitions.continued.label;
  }
  if (dom.legendNoTransmissionLabel) {
    dom.legendNoTransmissionLabel.textContent = statusDefinitions.noTransmission.label;
  }
  if (dom.legendEndemicLabel) {
    dom.legendEndemicLabel.textContent = statusDefinitions.endemic.label;
  }

  root.style.setProperty('--continued-transmission', statusDefinitions.continued.color);
  root.style.setProperty('--no-transmission', statusDefinitions.noTransmission.color);
  root.style.setProperty('--endemic', statusDefinitions.endemic.color);
}

function populateFilters() {
  populateSelect(
    dom.countryFilter,
    'All Countries',
    state.allData.map((item) => item.country)
  );
  populateSelect(
    dom.diseaseFilter,
    'All Diseases',
    state.allData.map((item) => item.disease)
  );
}

function populateSelect(selectEl, allLabel, values) {
  if (!selectEl) {
    return;
  }

  const currentValue = selectEl.value;
  const uniqueValues = Array.from(new Set(values.filter(Boolean))).sort();

  selectEl.innerHTML = '';
  selectEl.appendChild(new Option(allLabel, 'all'));

  uniqueValues.forEach((value) => {
    selectEl.appendChild(new Option(value, value));
  });

  selectEl.value = uniqueValues.includes(currentValue) ? currentValue : 'all';
}

function updateDataUpdateDate() {
  if (!dom.dataUpdateDate) {
    return;
  }

  dom.dataUpdateDate.textContent = getLatestUpdateDate(state.allData) || 'Unknown';
}

function updateDiseaseCount() {
  if (!dom.diseaseCount) {
    return;
  }

  const uniqueDiseases = new Set(
    getRenderableItems()
      .filter((item) => getStatusInfo(state.config, item.transmissionStatus).isContinued)
      .map((item) => item.disease)
  );

  dom.diseaseCount.textContent = uniqueDiseases.size;
}

function updateLegendVisibility() {
  const visibility = hasBlockingIssues()
    ? { continued: false, noTransmission: false, endemic: false }
    : getLegendVisibility(state.config, state.allData, state.filters);

  if (dom.legendContinued) {
    dom.legendContinued.style.display = visibility.continued ? 'flex' : 'none';
  }
  if (dom.legendNoTransmission) {
    dom.legendNoTransmission.style.display = visibility.noTransmission ? 'flex' : 'none';
  }
  if (dom.legendEndemic) {
    dom.legendEndemic.style.display = visibility.endemic ? 'flex' : 'none';
  }
}

function updateIssueBanner() {
  if (!dom.dataErrorBanner || !dom.dataErrorMessage) {
    return;
  }

  const issues = getIssues();
  if (issues.length === 0) {
    dom.dataErrorBanner.classList.add('hidden');
    dom.dataErrorMessage.textContent = '';
    return;
  }

  const preview = issues.slice(0, 3).join(' • ');
  const more = issues.length > 3 ? ` (+${issues.length - 3} more)` : '';
  dom.dataErrorMessage.textContent = `${preview}${more}`;
  dom.dataErrorBanner.classList.remove('hidden');
}

function applyFilters() {
  updateLegendVisibility();
  updateMapCountries();
  updateDiseaseCount();
}

function switchNavTab(tabName) {
  dom.navTabs.forEach((button) => button.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

  if (tabName === 'home') {
    dom.homeTab?.classList.add('active');
    dom.aboutTab?.classList.remove('active');
    invalidateMapSizeSoon();
    return;
  }

  dom.homeTab?.classList.remove('active');
  dom.aboutTab?.classList.add('active');
}

function switchContentTab(contentName) {
  dom.contentTabs.forEach((button) => button.classList.remove('active'));
  document.querySelector(`[data-content="${contentName}"]`)?.classList.add('active');

  dom.contentPanels.forEach((panel) => panel.classList.remove('active'));
  document.getElementById(`${contentName}-content`)?.classList.add('active');

  if (contentName === 'map') {
    invalidateMapSizeSoon();
  }
}

function renderPointGeometryItems(items) {
  const grouped = new Map();

  items.forEach((item) => {
    const override = getPointGeometryOverride(item);
    if (!override) {
      return;
    }

    if (!grouped.has(override.id)) {
      grouped.set(override.id, { override, items: [] });
    }

    grouped.get(override.id).items.push(item);
  });

  grouped.forEach(({ override, items: groupItems }) => {
    const primaryItem = groupItems.reduce((highest, item) => {
      if (!highest) {
        return item;
      }

      return getStatusPriority(state.config, item.transmissionStatus) >
        getStatusPriority(state.config, highest.transmissionStatus)
        ? item
        : highest;
    }, null);

    L.circleMarker(override.coordinates, {
      radius: 8,
      fillColor: getStatusColor(state.config, primaryItem.transmissionStatus),
      color: '#333',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85,
    })
      .addTo(state.countriesLayerGroup)
      .bindPopup(createCountryPopup(groupItems, override.label || groupItems[0].country));
  });
}

function updateMapCountries() {
  if (!state.countriesLayerGroup) {
    return;
  }

  state.countriesLayerGroup.clearLayers();

  const visibleItems = getRenderableItems();
  if (!visibleItems.length || !state.geoData) {
    return;
  }

  const pointGeometryItems = visibleItems.filter((item) => usesPointGeometry(item));
  const polygonItems = visibleItems.filter((item) => !usesPointGeometry(item));
  const countryItems = new Map();
  const countryStatuses = new Map();

  polygonItems.forEach((item) => {
    if (!item.country) {
      return;
    }

    if (!countryItems.has(item.country)) {
      countryItems.set(item.country, []);
    }
    countryItems.get(item.country).push(item);

    const priority = getStatusPriority(state.config, item.transmissionStatus);
    const current = countryStatuses.get(item.country);
    if (!current || priority > current.priority) {
      countryStatuses.set(item.country, {
        status: item.transmissionStatus,
        priority,
      });
    }
  });

  const dataCountries = Array.from(countryItems.keys());
  const matchedCountries = new Set();

  if (polygonItems.length > 0) {
    L.geoJSON(state.geoData, {
      filter: (feature) => Boolean(findMatchingCountryName(getGeoCountryName(feature), dataCountries)),
      style: (feature) => {
        const mappedCountry = findMatchingCountryName(getGeoCountryName(feature), dataCountries);
        const status = mappedCountry ? countryStatuses.get(mappedCountry)?.status : null;

        return status
          ? {
              fillColor: getStatusColor(state.config, status),
              fillOpacity: 0.7,
              color: '#333',
              weight: 1,
              opacity: 0.8,
            }
          : {};
      },
      onEachFeature: (feature, layer) => {
        const mappedCountry = findMatchingCountryName(getGeoCountryName(feature), dataCountries);
        if (!mappedCountry) {
          return;
        }

        matchedCountries.add(mappedCountry);
        layer.bindPopup(createCountryPopup(countryItems.get(mappedCountry) || [], mappedCountry));
      },
    }).addTo(state.countriesLayerGroup);
  }

  renderPointGeometryItems(pointGeometryItems);

  const unmatchedCountries = dataCountries.filter((country) => !matchedCountries.has(country));
  if (unmatchedCountries.length > 0) {
    console.warn('Countries in data not matched to GeoJSON:', unmatchedCountries);
  }
}

function createCountryPopup(countryData, countryName) {
  const sections = groupItemsByDisease(countryData)
    .map(({ disease, items }) => {
      const itemHtml = [...items]
        .sort((left, right) => {
          const priorityDelta =
            getStatusPriority(state.config, right.transmissionStatus) -
            getStatusPriority(state.config, left.transmissionStatus);
          if (priorityDelta !== 0) {
            return priorityDelta;
          }

          return (left.location || '').localeCompare(right.location || '');
        })
        .map((item) => createPopupEntry(item, countryName))
        .join('');

      return `
        <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #E0E0E0;">
          <strong style="color: #333; font-size: 14px;">${escapeHtml(disease)}</strong>
          ${itemHtml}
        </div>
      `;
    })
    .join('');

  return `
    <div style="min-width: 250px; font-family: Arial, sans-serif;">
      <h3 style="margin: 0 0 10px 0; color: #0072BC; font-size: 16px;">${escapeHtml(countryName || 'Unknown')}</h3>
      ${sections}
    </div>
  `;
}

function createPopupEntry(item, countryName) {
  const lines = [`<strong>Status:</strong> ${escapeHtml(item.transmissionStatus || 'N/A')}`];

  if (item.location && item.location !== countryName) {
    lines.push(`<strong>Location:</strong> ${escapeHtml(item.location)}`);
  }
  if (item.lastUpdated) {
    lines.push(`<strong>Last Updated:</strong> ${escapeHtml(item.lastUpdated)}`);
  }
  if (item.notes) {
    lines.push(`<strong>Notes:</strong> ${escapeHtml(item.notes)}`);
  }
  if (item.reference) {
    lines.push(
      `<strong>Source:</strong> <a href="${escapeHtml(item.reference)}" target="_blank" rel="noopener noreferrer" style="color: #0072BC;">Link</a>`
    );
  }

  return `<p style="margin: 5px 0; font-size: 12px; color: #666;">${lines.join('<br>')}</p>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[char];
  });
}

async function initApp() {
  initDom();
  applyConfigToUI();
  initializeMap();
  setupEventListeners();

  await loadData();
  await loadCountryBoundaries();

  refreshValidation();
  populateFilters();
  applyFilters();
}

document.addEventListener('DOMContentLoaded', initApp);
