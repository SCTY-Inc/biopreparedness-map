export const COUNTRY_NAME_MAP = {
  'Democratic Republic of the Congo': [
    'DR Congo',
    'Congo, Democratic Republic of',
    'Congo, the Democratic Republic of the',
    'Democratic Republic of Congo',
  ],
  Congo: ['Republic of the Congo', 'Congo, Republic of'],
  Tanzania: ['United Republic of Tanzania', 'Tanzania, United Republic of'],
  "Côte d'Ivoire": ['Ivory Coast', "Cote d'Ivoire", 'Cote dIvoire'],
  'North Macedonia': ['Macedonia'],
  'Türkiye': ['Turkey'],
};

export const GEO_EXEMPT_COUNTRIES = new Set(['Singapore']);

export const POINT_GEOMETRY_OVERRIDES = [
  {
    id: 'country-singapore',
    country: 'Singapore',
    coordinates: [1.3521, 103.8198],
    label: 'Singapore',
  },
  {
    id: 'regional-russia-cchf',
    country: 'Russia',
    disease: 'Crimean-Congo Hemorrhagic Fever',
    location: 'Southern endemic foci',
    coordinates: [44.8, 43.3],
    label: 'Russia - Southern endemic foci',
  },
  {
    id: 'regional-russia-omsk',
    country: 'Russia',
    disease: 'Omsk Hemorrhagic Fever Virus',
    location: 'Western Siberia',
    coordinates: [55.0, 73.4],
    label: 'Russia - Western Siberia',
  },
  {
    id: 'regional-china-cchf',
    country: 'China',
    disease: 'Crimean-Congo Hemorrhagic Fever',
    location: 'Northwestern/Xinjiang',
    coordinates: [41.7, 86.1],
    label: 'China - Northwestern/Xinjiang',
  },
  {
    id: 'regional-argentina-junin',
    country: 'Argentina',
    disease: 'Junin Virus',
    location: 'Argentine Pampas',
    coordinates: [-34.6, -62.7],
    label: 'Argentina - Argentine Pampas',
  },
  {
    id: 'regional-bolivia-chapare',
    country: 'Bolivia',
    disease: 'Chapare Virus',
    location: 'Chapare region',
    coordinates: [-16.9, -65.4],
    label: 'Bolivia - Chapare region',
  },
  {
    id: 'regional-brazil-sabia',
    country: 'Brazil',
    disease: 'Sabia Virus',
    location: 'São Paulo state',
    coordinates: [-22.4, -48.6],
    label: 'Brazil - São Paulo state',
  },
  {
    id: 'regional-bolivia-machupo',
    country: 'Bolivia',
    disease: 'Machupo Virus',
    location: 'Beni department',
    coordinates: [-14.6, -65.5],
    label: 'Bolivia - Beni department',
  },
  {
    id: 'regional-venezuela-guanarito',
    country: 'Venezuela',
    disease: 'Guanarito Virus',
    location: 'Portuguesa state',
    coordinates: [9.4, -69.6],
    label: 'Venezuela - Portuguesa state',
  },
  {
    id: 'regional-india-kfd',
    country: 'India',
    disease: 'Kyasanur Forest Disease Virus',
    location: 'Karnataka State',
    coordinates: [14.5, 75.9],
    label: 'India - Karnataka State',
  },
];

const GENERIC_LOCATIONS = new Set(['multiple regions', 'multiple states']);

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

export function canonicalizeCountryName(countryName) {
  if (!countryName) return countryName;

  const normalized = normalizeText(countryName);
  for (const [canonical, variants] of Object.entries(COUNTRY_NAME_MAP)) {
    if (normalizeText(canonical) === normalized) {
      return canonical;
    }

    if (variants.some((variant) => normalizeText(variant) === normalized)) {
      return canonical;
    }
  }

  return countryName;
}

export function getCountryAliases(countryName) {
  if (!countryName) {
    return [];
  }

  const aliases = new Set([countryName]);
  const canonical = canonicalizeCountryName(countryName);
  aliases.add(canonical);

  for (const variant of COUNTRY_NAME_MAP[canonical] || []) {
    aliases.add(variant);
  }

  return Array.from(aliases);
}

export function countriesMatch(leftCountry, rightCountry) {
  if (!leftCountry || !rightCountry) {
    return false;
  }

  const rightNormalized = normalizeText(rightCountry);
  return getCountryAliases(leftCountry).some((alias) => normalizeText(alias) === rightNormalized);
}

export function findMatchingCountryName(geoName, candidateCountries) {
  for (const country of candidateCountries) {
    if (countriesMatch(country, geoName)) {
      return country;
    }
  }

  return null;
}

export function getPointGeometryOverride(item) {
  if (!item?.country) {
    return null;
  }

  const canonicalCountry = canonicalizeCountryName(item.country);
  return (
    POINT_GEOMETRY_OVERRIDES.find((override) => {
      if (override.country !== canonicalCountry) {
        return false;
      }

      if (override.disease && override.disease !== item.disease) {
        return false;
      }

      if (override.location && override.location !== item.location) {
        return false;
      }

      return true;
    }) || null
  );
}

export function usesPointGeometry(item) {
  return Boolean(getPointGeometryOverride(item));
}

export function requiresPointGeometry(item) {
  if (!item?.country) {
    return false;
  }

  const canonicalCountry = canonicalizeCountryName(item.country);
  if (GEO_EXEMPT_COUNTRIES.has(canonicalCountry)) {
    return true;
  }

  if (item.transmissionStatus !== 'Endemic') {
    return false;
  }

  const location = normalizeText(item.location);
  return Boolean(location) && !GENERIC_LOCATIONS.has(location);
}
