import { state, getFilteredData, getStatusColor, getStatusInfo, getStatusPriority } from './app.js';
import {
  countriesMatch,
  findMatchingCountryName,
  getPointGeometryOverride,
  usesPointGeometry,
} from './geo.js';

// --- Geo helpers ---

function getGeoCountryName(feature) {
  return (
    feature.properties.NAME ||
    feature.properties.name ||
    feature.properties.NAME_LONG ||
    feature.properties.ADMIN ||
    feature.properties.NAME_EN ||
    feature.properties.NAME_ENG ||
    feature.properties.country ||
    feature.properties.Country
  );
}

function findMatchingCountry(geoName, dataCountries) {
  if (!geoName) return null;
  return findMatchingCountryName(geoName, dataCountries);
}

// --- Geometry helpers ---

/**
 * Filter out overseas territory polygons for countries like France.
 * Keeps only polygons whose centroid falls within a reasonable bounding box
 * around the country's expected location (metropolitan territory).
 */
function filterOverseasTerritories(feature) {
  if (!feature.geometry || feature.geometry.type !== 'MultiPolygon') return feature;

  const name = getGeoCountryName(feature);
  if (!name) return feature;

  const bounds = {
    France: { minLat: 41, maxLat: 52, minLng: -6, maxLng: 10 },
  };

  const countryBounds = bounds[name];
  if (!countryBounds) return feature;

  const filtered = feature.geometry.coordinates.filter((polygon) => {
    const ring = polygon[0];
    if (!ring || ring.length === 0) return true;

    const avgLng = ring.reduce((sum, coordinate) => sum + coordinate[0], 0) / ring.length;
    const avgLat = ring.reduce((sum, coordinate) => sum + coordinate[1], 0) / ring.length;

    return (
      avgLat >= countryBounds.minLat &&
      avgLat <= countryBounds.maxLat &&
      avgLng >= countryBounds.minLng &&
      avgLng <= countryBounds.maxLng
    );
  });

  if (filtered.length === 0) return feature;

  return {
    ...feature,
    geometry: { ...feature.geometry, coordinates: filtered },
  };
}

// --- Country centroid lookup (derived from GeoJSON) ---

const countryCentroids = {};

function buildCountryCentroids(geoJson) {
  Object.keys(countryCentroids).forEach((key) => delete countryCentroids[key]);

  for (const feature of geoJson.features) {
    const name = getGeoCountryName(feature);
    if (!name) continue;

    const layer = L.geoJSON(feature);
    const center = layer.getBounds().getCenter();
    countryCentroids[name] = [center.lat, center.lng];
  }

  console.log(`Built centroids for ${Object.keys(countryCentroids).length} countries`);
}

function getCountryCentroid(countryName) {
  for (const [centroidCountry, centroid] of Object.entries(countryCentroids)) {
    if (countriesMatch(countryName, centroidCountry)) {
      return centroid;
    }
  }

  return null;
}

function isVisibleItem(item) {
  const statusInfo = getStatusInfo(item.transmissionStatus);
  if (statusInfo.isEndemic && !state.filters.showEndemic) return false;
  if (statusInfo.isOutbreak && !state.filters.showOutbreaks) return false;
  return statusInfo.isEndemic || statusInfo.isOutbreak;
}

function groupPointItems(items) {
  const grouped = new Map();

  items.forEach((item) => {
    const override = getPointGeometryOverride(item);
    if (!override) return;

    if (!grouped.has(override.id)) {
      grouped.set(override.id, {
        override,
        items: [],
      });
    }

    grouped.get(override.id).items.push(item);
  });

  return Array.from(grouped.values());
}

function renderPointGeometryItems(items) {
  groupPointItems(items).forEach(({ override, items: groupItems }) => {
    if (!groupItems.length) return;

    const primaryItem = groupItems.reduce((highestPriorityItem, item) => {
      if (!highestPriorityItem) return item;

      return getStatusPriority(item.transmissionStatus) >
        getStatusPriority(highestPriorityItem.transmissionStatus)
        ? item
        : highestPriorityItem;
    }, null);

    const marker = L.circleMarker(override.coordinates, {
      radius: 8,
      fillColor: getStatusColor(primaryItem.transmissionStatus),
      color: '#333',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85,
    }).addTo(state.countriesLayerGroup);

    marker.bindPopup(createCountryPopup(groupItems, override.label || groupItems[0].country));
  });
}

// --- Map logic ---

export function initializeMap() {
  const mapConfig = state.config?.map;

  state.map = L.map('map', {
    zoomControl: true,
    attributionControl: true,
    minZoom: 2,
    maxZoom: 10,
  }).setView(mapConfig?.center || [20, 15], mapConfig?.zoom || 2);

  L.tileLayer(mapConfig?.tileUrl || '', {
    attribution: mapConfig?.attribution || '',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(state.map);

  state.map.getContainer().style.backgroundColor = '#D8DCDC';
  state.countriesLayerGroup = L.layerGroup().addTo(state.map);
}

export async function loadCountryBoundaries() {
  try {
    let geoJson = null;
    let lastError = null;

    const sources = state.config?.map?.geojsonSources || [];
    for (const source of sources) {
      try {
        const response = await fetch(source);
        if (response.ok) {
          geoJson = await response.json();
          console.log(`Successfully loaded GeoJSON from: ${source}`);
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Failed to load from ${source}:`, err);
      }
    }

    if (!geoJson) {
      throw lastError || new Error('Could not load country boundaries from any source');
    }

    state.geoData = {
      ...geoJson,
      features: geoJson.features.map(filterOverseasTerritories),
    };
    buildCountryCentroids(state.geoData);
    updateMapCountries();
  } catch (error) {
    console.error('Error loading country boundaries:', error);
    state.geoData = null;
    updateMapCountries();
  }
}

export function updateMapCountries() {
  if (state.countriesLayerGroup) {
    state.countriesLayerGroup.clearLayers();
  }

  if (!state.filters.showOutbreaks && !state.filters.showEndemic) {
    return;
  }

  const filtered = getFilteredData().filter(isVisibleItem);
  const pointGeometryItems = filtered.filter((item) => usesPointGeometry(item));
  const polygonItems = filtered.filter((item) => !usesPointGeometry(item));

  if (!state.geoData || !state.countryDataMap) {
    updateMapMarkers(filtered);
    return;
  }

  const countryStatusMap = {};

  polygonItems.forEach((item) => {
    if (!item.country) return;

    const country = item.country;
    if (!countryStatusMap[country]) {
      countryStatusMap[country] = {
        status: item.transmissionStatus,
        priority: getStatusPriority(item.transmissionStatus),
      };
      return;
    }

    const currentPriority = countryStatusMap[country].priority;
    const newPriority = getStatusPriority(item.transmissionStatus);
    if (newPriority > currentPriority) {
      countryStatusMap[country] = {
        status: item.transmissionStatus,
        priority: newPriority,
      };
    }
  });

  let matchedCount = 0;
  const matchedCountries = new Set();

  L.geoJSON(state.geoData, {
    filter: (feature) => {
      const countryName = getGeoCountryName(feature);
      if (!countryName) return false;

      const mappedCountry = findMatchingCountry(countryName, Object.keys(countryStatusMap));
      if (!mappedCountry || !countryStatusMap[mappedCountry]) {
        return false;
      }

      const countryData = state.countryDataMap[mappedCountry] || [];
      return countryData.some((item) => !usesPointGeometry(item) && isVisibleItem(item));
    },
    style: (feature) => {
      const countryName = getGeoCountryName(feature);
      if (!countryName) return {};

      const mappedCountry = findMatchingCountry(countryName, Object.keys(countryStatusMap));
      if (!mappedCountry) return {};

      const status = countryStatusMap[mappedCountry].status;
      return {
        fillColor: getStatusColor(status),
        fillOpacity: 0.7,
        color: '#333',
        weight: 1,
        opacity: 0.8,
      };
    },
    onEachFeature: (feature, layer) => {
      const countryName = getGeoCountryName(feature);
      const mappedCountry = findMatchingCountry(countryName, Object.keys(countryStatusMap));
      if (!mappedCountry) return;

      matchedCount++;
      matchedCountries.add(mappedCountry);

      const countryData = state.countryDataMap[mappedCountry] || [];
      const filteredCountryData = countryData.filter(
        (item) => !usesPointGeometry(item) && isVisibleItem(item)
      );

      if (filteredCountryData.length > 0) {
        layer.bindPopup(createCountryPopup(filteredCountryData, mappedCountry));
      }
    },
  }).addTo(state.countriesLayerGroup);

  console.log(`Matched ${matchedCount} features for ${matchedCountries.size} unique countries`);

  const unmatchedDataCountries = Object.keys(countryStatusMap).filter(
    (country) => !matchedCountries.has(country)
  );
  if (unmatchedDataCountries.length > 0) {
    console.warn('Countries in data not matched to GeoJSON:', unmatchedDataCountries);
  }

  renderPointGeometryItems(pointGeometryItems);
}

function createCountryPopup(countryData, countryName) {
  const safeCountryName = escapeHtml(countryName || 'Unknown');
  let html = '<div style="min-width: 250px; font-family: Arial, sans-serif;">';
  html += `<h3 style="margin: 0 0 10px 0; color: #0072BC; font-size: 16px;">${safeCountryName}</h3>`;

  const diseases = {};
  countryData.forEach((item) => {
    if (!diseases[item.disease]) {
      diseases[item.disease] = [];
    }
    diseases[item.disease].push(item);
  });

  Object.keys(diseases).forEach((disease) => {
    const items = diseases[disease];
    const safeDisease = escapeHtml(disease || 'N/A');
    html +=
      '<div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #E0E0E0;">';
    html += `<strong style="color: #333; font-size: 14px;">${safeDisease}</strong>`;

    items.forEach((item) => {
      const safeStatus = escapeHtml(item.transmissionStatus || 'N/A');
      html += '<p style="margin: 5px 0; font-size: 12px; color: #666;">';
      html += `<strong>Status:</strong> ${safeStatus}<br>`;
      if (item.location && item.location !== countryName) {
        html += `<strong>Location:</strong> ${escapeHtml(item.location)}<br>`;
      }
      if (item.lastUpdated) {
        html += `<strong>Last Updated:</strong> ${escapeHtml(item.lastUpdated)}<br>`;
      }
      if (item.notes) {
        html += `<strong>Notes:</strong> ${escapeHtml(item.notes)}`;
      }
      if (item.reference) {
        html += `<br><strong>Source:</strong> <a href="${escapeHtml(item.reference)}" target="_blank" rel="noopener noreferrer" style="color: #0072BC;">Link</a>`;
      }
      html += '</p>';
    });
    html += '</div>';
  });

  html += '</div>';
  return html;
}

function updateMapMarkers(filteredItems = getFilteredData().filter(isVisibleItem)) {
  if (state.countriesLayerGroup) {
    state.countriesLayerGroup.clearLayers();
  }

  const pointGeometryItems = filteredItems.filter((item) => usesPointGeometry(item));
  renderPointGeometryItems(pointGeometryItems);

  filteredItems
    .filter((item) => !usesPointGeometry(item))
    .forEach((item) => {
      const centroid = getCountryCentroid(item.country);
      if (!centroid) return;

      const marker = L.circleMarker(centroid, {
        radius: 8,
        fillColor: getStatusColor(item.transmissionStatus),
        color: '#333',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7,
      }).addTo(state.countriesLayerGroup);

      marker.bindPopup(`
                  <div style="min-width: 200px; font-family: Arial, sans-serif;">
                      <h3 style="margin: 0 0 10px 0; color: #0072BC; font-size: 16px;">${escapeHtml(item.disease || 'N/A')}</h3>
                      <p style="margin: 5px 0; font-size: 13px;"><strong>Location:</strong> ${escapeHtml(item.location || 'N/A')}</p>
                      <p style="margin: 5px 0; font-size: 13px;"><strong>Country:</strong> ${escapeHtml(item.country || 'N/A')}</p>
                      <p style="margin: 5px 0; font-size: 13px;"><strong>Status:</strong> ${escapeHtml(item.transmissionStatus || 'N/A')}</p>
                      ${item.lastUpdated ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Last Updated:</strong> ${escapeHtml(item.lastUpdated)}</p>` : ''}
                      ${item.notes ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Notes:</strong> ${escapeHtml(item.notes)}</p>` : ''}
                      ${item.reference ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Source:</strong> <a href="${escapeHtml(item.reference)}" target="_blank" rel="noopener noreferrer" style="color: #0072BC;">Link</a></p>` : ''}
                  </div>
              `);
    });
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
