import {
  GEO_EXEMPT_COUNTRIES,
  canonicalizeCountryName,
  countriesMatch,
  getPointGeometryOverride,
  requiresPointGeometry,
} from './geo.js';

export const DEFAULT_CONFIG = {
  siteTitle: 'Special Pathogens Biopreparedness Map',
  subtitle: 'Developed by NYC Health + Hospitals System Biopreparedness Program',
  footerText: '© 2026 NYC Health + Hospitals.',
  dataUrl: 'data.json',
  map: {
    center: [20, 15],
    zoom: 2,
    tileUrl: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    geojsonSources: ['assets/world.geojson'],
  },
  statusDefinitions: {
    continued: {
      label: 'Continued transmission',
      color: '#F28B46',
      className: 'continued-transmission',
      priority: 3,
      match: {
        includes: ['continued transmission'],
        excludes: ['no continued'],
      },
    },
    noTransmission: {
      label: 'No continued transmission',
      color: '#5078A1',
      className: 'no-transmission',
      priority: 2,
      match: {
        includes: ['no continued', 'no transmission'],
        excludes: [],
      },
    },
    endemic: {
      label: 'Endemic',
      color: '#86CC9F',
      className: 'endemic',
      priority: 1,
      match: {
        includes: ['endemic'],
        excludes: [],
      },
    },
  },
};

export const VALID_STATUSES = ['Continued Transmission', 'No Continued Transmission', 'Endemic'];

export const CANONICAL_DISEASES = [
  'Alkhurma Hemorrhagic Fever Virus',
  'Andes Virus',
  'Avian Influenza, H5N1',
  'Avian Influenza, H9N2',
  'Bundibugyo Virus',
  'Chapare Virus',
  'Crimean-Congo Hemorrhagic Fever',
  'Ebola',
  'Guanarito Virus',
  'Junin Virus',
  'Kyasanur Forest Disease Virus',
  'Lassa Fever',
  'Lujo Virus',
  'MERS',
  'Machupo Virus',
  'Marburg',
  'Mpox Clade Ia',
  'Mpox Clade Ib',
  'Nipah Virus',
  'Omsk Hemorrhagic Fever Virus',
  'Ravn Virus',
  'Sabia Virus',
  'Severe Fever with Thrombocytopenia Syndrome (SFTS)',
  'Sudan Virus',
  'Taï Forest Virus',
];

const ENTRY_FIELDS = [
  'disease',
  'location',
  'country',
  'transmissionStatus',
  'lastUpdated',
  'notes',
  'reference',
];
const REQUIRED_FIELDS = new Set(ENTRY_FIELDS);
const ALLOWED_FIELDS = new Set(ENTRY_FIELDS);
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase();
}

export function getGeoCountryName(feature) {
  return (
    feature?.properties?.NAME ||
    feature?.properties?.name ||
    feature?.properties?.NAME_LONG ||
    feature?.properties?.ADMIN ||
    feature?.properties?.NAME_EN ||
    feature?.properties?.NAME_ENG ||
    feature?.properties?.country ||
    feature?.properties?.Country
  );
}

function isValidDate(value) {
  const normalized = String(value || '').trim();
  if (!ISO_DATE_PATTERN.test(normalized)) {
    return false;
  }

  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function getSafeReferenceUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function buildGeoNameSet(geoFeatures = []) {
  const geoNames = new Set();

  for (const feature of geoFeatures) {
    const name = getGeoCountryName(feature);
    if (name) {
      geoNames.add(name);
    }
  }

  return geoNames;
}

function resolvesCountry(country, geoNames) {
  for (const geoName of geoNames) {
    if (countriesMatch(country, geoName)) {
      return true;
    }
  }

  return false;
}

export function getStatusKey(config, status) {
  const normalized = normalizeStatus(status);

  for (const [key, definition] of Object.entries(config?.statusDefinitions || {})) {
    const includesMatch = definition.match?.includes?.some((term) => normalized.includes(term));
    const excludesMatch = definition.match?.excludes?.some((term) => normalized.includes(term));

    if (includesMatch && !excludesMatch) {
      return key;
    }
  }

  return null;
}

export function getStatusInfo(config, status) {
  const key = getStatusKey(config, status);

  return {
    key,
    isEndemic: key === 'endemic',
    isOutbreak: key === 'continued' || key === 'noTransmission',
    isContinued: key === 'continued',
    isNoTransmission: key === 'noTransmission',
  };
}

export function getStatusPriority(config, status) {
  const key = getStatusKey(config, status);
  return key ? (config?.statusDefinitions?.[key]?.priority ?? 0) : 0;
}

export function getStatusColor(config, status) {
  const key = getStatusKey(config, status);
  return key ? (config?.statusDefinitions?.[key]?.color ?? '#95a5a6') : '#95a5a6';
}

export function filterData(items, filters = {}, searchTerm = '') {
  const activeFilters = {
    country: 'all',
    disease: 'all',
    ...filters,
  };

  let filtered = items;

  if (activeFilters.country !== 'all') {
    filtered = filtered.filter((item) => item.country === activeFilters.country);
  }

  if (activeFilters.disease !== 'all') {
    filtered = filtered.filter((item) => item.disease === activeFilters.disease);
  }

  if (!searchTerm) {
    return filtered;
  }

  const term = searchTerm.toLowerCase();
  return filtered.filter(
    (item) =>
      item.location?.toLowerCase().includes(term) ||
      item.country?.toLowerCase().includes(term) ||
      item.disease?.toLowerCase().includes(term) ||
      item.notes?.toLowerCase().includes(term)
  );
}

export function isVisibleItem(config, filters = {}, item) {
  const activeFilters = {
    showOutbreaks: true,
    showEndemic: true,
    ...filters,
  };
  const statusInfo = getStatusInfo(config, item.transmissionStatus);

  if (statusInfo.isEndemic) {
    return activeFilters.showEndemic;
  }

  if (statusInfo.isOutbreak) {
    return activeFilters.showOutbreaks;
  }

  return false;
}

export function getVisibleItems(config, items, filters = {}, searchTerm = '') {
  return filterData(items, filters, searchTerm).filter((item) => isVisibleItem(config, filters, item));
}

export function getLegendVisibility(config, items, filters = {}, searchTerm = '') {
  const visibleItems = getVisibleItems(config, items, filters, searchTerm);

  return {
    continued: visibleItems.some((item) => getStatusInfo(config, item.transmissionStatus).isContinued),
    noTransmission: visibleItems.some(
      (item) => getStatusInfo(config, item.transmissionStatus).isNoTransmission
    ),
    endemic: visibleItems.some((item) => getStatusInfo(config, item.transmissionStatus).isEndemic),
  };
}

export function getFilterStatusMessage(config, visibleItems, filters = {}) {
  if (visibleItems.length === 0) {
    return 'No map entries match these filters.';
  }

  const disease = filters.disease;
  const isEndemicOnly = visibleItems.every(
    (item) => getStatusInfo(config, item.transmissionStatus).isEndemic
  );
  if (disease && disease !== 'all' && isEndemicOnly) {
    return `${disease} is currently shown as endemic.`;
  }

  return '';
}

export function getLatestUpdateDate(items) {
  const validDates = items
    .map((item) => String(item.lastUpdated || '').trim())
    .filter((date) => isValidDate(date))
    .sort();

  return validDates.at(-1) || null;
}

export function groupItemsByDisease(items) {
  const groups = new Map();

  for (const item of items) {
    const disease = item.disease || 'Unknown';
    if (!groups.has(disease)) {
      groups.set(disease, []);
    }
    groups.get(disease).push(item);
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([disease, diseaseItems]) => ({ disease, items: diseaseItems }));
}

export function validateEntries(items, { geoFeatures } = {}) {
  if (!Array.isArray(items)) {
    return ['Data "pathogens" must be an array'];
  }

  const errors = [];
  const geoNames = Array.isArray(geoFeatures) && geoFeatures.length > 0 ? buildGeoNameSet(geoFeatures) : null;

  items.forEach((item, index) => {
    for (const field of REQUIRED_FIELDS) {
      if (!item[field]) {
        errors.push(`Entry ${index + 1}: missing required field "${field}"`);
      }
    }

    for (const field of Object.keys(item)) {
      if (!ALLOWED_FIELDS.has(field)) {
        errors.push(
          `Entry ${index + 1} (${item.country || 'Unknown'}): unsupported field "${field}"`
        );
      }
    }

    if (item.transmissionStatus && !VALID_STATUSES.includes(item.transmissionStatus)) {
      errors.push(
        `Entry ${index + 1} (${item.country || 'Unknown'}): invalid status "${item.transmissionStatus}"`
      );
    }

    if (item.disease && !CANONICAL_DISEASES.includes(item.disease)) {
      errors.push(
        `Entry ${index + 1} (${item.country || 'Unknown'}): non-canonical disease "${item.disease}"`
      );
    }

    if (item.reference && !getSafeReferenceUrl(item.reference)) {
      errors.push(
        `Entry ${index + 1} (${item.country || 'Unknown'}): reference must be a valid HTTPS URL`
      );
    }

    if (item.lastUpdated && !isValidDate(item.lastUpdated)) {
      errors.push(
        `Entry ${index + 1} (${item.country || 'Unknown'}): invalid lastUpdated "${item.lastUpdated}"`
      );
    }

    const canonicalCountry = canonicalizeCountryName(item.country);
    if (item.country && canonicalCountry !== item.country) {
      errors.push(
        `Entry ${index + 1}: use canonical country "${canonicalCountry}" instead of "${item.country}"`
      );
    }

    if (
      item.country &&
      geoNames &&
      !resolvesCountry(item.country, geoNames) &&
      !GEO_EXEMPT_COUNTRIES.has(canonicalCountry)
    ) {
      errors.push(
        `Entry ${index + 1}: country "${item.country}" not found in GeoJSON. Add to COUNTRY_NAME_MAP?`
      );
    }

    if (requiresPointGeometry(item) && !getPointGeometryOverride(item)) {
      errors.push(
        `Entry ${index + 1}: "${item.country}" / "${item.location}" needs a point geometry override`
      );
    }
  });

  const seen = new Set();
  items.forEach((item, index) => {
    if (!item.disease || !item.country) {
      return;
    }

    const key = `${item.disease}::${canonicalizeCountryName(item.country)}`;
    if (seen.has(key)) {
      errors.push(`Entry ${index + 1}: duplicate ${item.disease} + ${item.country}`);
    }
    seen.add(key);
  });

  const dates = new Set(items.map((item) => item.lastUpdated).filter(Boolean));
  if (dates.size > 1) {
    errors.push(`Multiple lastUpdated dates found: ${[...dates].join(', ')}`);
  }

  return errors;
}
