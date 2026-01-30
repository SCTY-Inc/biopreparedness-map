import { COUNTRY_NAME_MAP } from './config.js';

export function getGeoCountryName(feature) {
    return feature.properties.NAME ||
        feature.properties.name ||
        feature.properties.NAME_LONG ||
        feature.properties.ADMIN ||
        feature.properties.NAME_EN ||
        feature.properties.NAME_ENG ||
        feature.properties.country ||
        feature.properties.Country;
}

export function findMatchingCountry(geoName, dataCountries) {
    if (!geoName) return null;

    const geoLower = geoName.toLowerCase().trim();
    for (const dataCountry of dataCountries) {
        if (dataCountry.toLowerCase().trim() === geoLower) {
            return dataCountry;
        }
    }

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

    for (const [key, values] of Object.entries(COUNTRY_NAME_MAP)) {
        if (key.toLowerCase().trim() === geoLower) {
            if (dataCountries.includes(key)) return key;
        }
        for (const value of values) {
            if (value.toLowerCase().trim() === geoLower) {
                if (dataCountries.includes(key)) return key;
            }
        }
    }

    return null;
}
