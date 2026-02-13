import { state } from './state.js';
import { getFilteredData } from './data.js';
import { getStatusColor, getStatusInfo, getStatusPriority } from './status.js';
import { COUNTRY_NAME_MAP } from './config.js';

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

  const geoLower = geoName.toLowerCase().trim();

  // Direct match
  for (const dataCountry of dataCountries) {
    if (dataCountry.toLowerCase().trim() === geoLower) {
      return dataCountry;
    }
  }

  // Check COUNTRY_NAME_MAP variants
  for (const dataCountry of dataCountries) {
    const mappings = COUNTRY_NAME_MAP[dataCountry];
    if (mappings) {
      for (const mappedName of mappings) {
        if (mappedName.toLowerCase().trim() === geoLower) {
          return dataCountry;
        }
      }
    }
  }

  return null;
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

  // Countries with overseas territories that cause rendering issues
  const bounds = {
    France: { minLat: 41, maxLat: 52, minLng: -6, maxLng: 10 },
  };

  const countryBounds = bounds[name];
  if (!countryBounds) return feature;

  const filtered = feature.geometry.coordinates.filter((polygon) => {
    // Get rough centroid from first ring of polygon
    const ring = polygon[0];
    if (!ring || ring.length === 0) return true;
    const avgLng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
    const avgLat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
    return (
      avgLat >= countryBounds.minLat &&
      avgLat <= countryBounds.maxLat &&
      avgLng >= countryBounds.minLng &&
      avgLng <= countryBounds.maxLng
    );
  });

  if (filtered.length === 0) return feature; // fallback: don't remove everything

  return {
    ...feature,
    geometry: { ...feature.geometry, coordinates: filtered },
  };
}

// --- Country centroid lookup (derived from GeoJSON) ---

const countryCentroids = {};

function buildCountryCentroids(geoJson) {
  for (const feature of geoJson.features) {
    const name = getGeoCountryName(feature);
    if (!name) continue;

    const layer = L.geoJSON(feature);
    const center = layer.getBounds().getCenter();
    countryCentroids[name] = [center.lat, center.lng];
  }
  console.log(`Built centroids for ${Object.keys(countryCentroids).length} countries`);
}

/**
 * Look up a centroid by data country name, checking COUNTRY_NAME_MAP variants.
 */
function getCountryCentroid(countryName) {
  if (countryCentroids[countryName]) return countryCentroids[countryName];

  // Check COUNTRY_NAME_MAP variants
  const mappings = COUNTRY_NAME_MAP[countryName];
  if (mappings) {
    for (const variant of mappings) {
      if (countryCentroids[variant]) return countryCentroids[variant];
    }
  }

  // Reverse lookup: check if any map key's variants match
  for (const [, variants] of Object.entries(COUNTRY_NAME_MAP)) {
    for (const variant of variants) {
      if (variant.toLowerCase() === countryName.toLowerCase() && countryCentroids[variant]) {
        return countryCentroids[variant];
      }
    }
  }

  return null;
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

    // Filter overseas territories once, reuse everywhere
    state.geoData = {
      ...geoJson,
      features: geoJson.features.map(filterOverseasTerritories),
    };
    buildCountryCentroids(state.geoData);
    updateMapCountries();
  } catch (error) {
    console.error('Error loading country boundaries:', error);
    console.log('Falling back to marker-based visualization');
    updateMapMarkers();
  }
}

export function updateMapCountries() {
  if (state.countriesLayerGroup) {
    state.countriesLayerGroup.clearLayers();
  }

  if (!state.filters.showOutbreaks && !state.filters.showEndemic) {
    return;
  }

  if (!state.geoData || !state.countryDataMap) {
    updateMapMarkers();
    return;
  }

  const filtered = getFilteredData();
  const countryStatusMap = {};

  filtered.forEach((item) => {
    if (!item.country) return;

    const statusInfo = getStatusInfo(item.transmissionStatus);
    if (statusInfo.isEndemic && !state.filters.showEndemic) return;
    if (statusInfo.isOutbreak && !state.filters.showOutbreaks) return;
    if (!statusInfo.isEndemic && !statusInfo.isOutbreak) return;

    const country = item.country;
    if (!countryStatusMap[country]) {
      countryStatusMap[country] = {
        status: item.transmissionStatus,
        priority: getStatusPriority(item.transmissionStatus),
      };
    } else {
      const currentPriority = countryStatusMap[country].priority;
      const newPriority = getStatusPriority(item.transmissionStatus);
      if (newPriority > currentPriority) {
        countryStatusMap[country] = {
          status: item.transmissionStatus,
          priority: newPriority,
        };
      }
    }
  });

  let matchedCount = 0;
  const matchedCountries = new Set();

  L.geoJSON(state.geoData, {
    filter: (feature) => {
      const countryName = getGeoCountryName(feature);
      if (!countryName) return false;
      const mappedCountry = findMatchingCountry(countryName, Object.keys(countryStatusMap));

      if (mappedCountry && countryStatusMap[mappedCountry]) {
        const countryData = state.countryDataMap[mappedCountry] || [];
        const hasVisibleData = countryData.some((item) => {
          const statusInfo = getStatusInfo(item.transmissionStatus);
          if (statusInfo.isEndemic && !state.filters.showEndemic) return false;
          if (statusInfo.isOutbreak && !state.filters.showOutbreaks) return false;
          return statusInfo.isEndemic || statusInfo.isOutbreak;
        });
        return hasVisibleData;
      }
      return false;
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
      const filteredCountryData = countryData.filter((item) => {
        const statusInfo = getStatusInfo(item.transmissionStatus);
        if (statusInfo.isEndemic && !state.filters.showEndemic) return false;
        if (statusInfo.isOutbreak && !state.filters.showOutbreaks) return false;
        return statusInfo.isEndemic || statusInfo.isOutbreak;
      });

      if (filteredCountryData.length > 0) {
        layer.bindPopup(createCountryPopup(filteredCountryData, mappedCountry));
      }
    },
  }).addTo(state.countriesLayerGroup);

  console.log(`Matched ${matchedCount} features for ${matchedCountries.size} unique countries`);

  const unmatchedDataCountries = Object.keys(countryStatusMap).filter(
    (c) => !matchedCountries.has(c)
  );
  if (unmatchedDataCountries.length > 0) {
    console.warn('Countries in data not matched to GeoJSON:', unmatchedDataCountries);
  }
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
      html += '</p>';
    });
    html += '</div>';
  });

  html += '</div>';
  return html;
}

function updateMapMarkers() {
  const filtered = getFilteredData();

  if (state.countriesLayerGroup) {
    state.countriesLayerGroup.clearLayers();
  }

  filtered.forEach((item) => {
    const centroid = getCountryCentroid(item.country);
    if (!centroid) return;

    const statusInfo = getStatusInfo(item.transmissionStatus);
    if (statusInfo.isEndemic && !state.filters.showEndemic) return;
    if (statusInfo.isOutbreak && !state.filters.showOutbreaks) return;

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
