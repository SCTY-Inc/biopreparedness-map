import { state } from './state.js';

export async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        state.allData = data.pathogens || [];
        console.log(`Data loaded: ${state.allData.length} pathogen entries`);

        if (state.allData.length === 0) {
            console.warn('No pathogen data found in data.json');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        state.allData = [];
    }
}

export function buildCountryDataMap() {
    const countryData = {};

    state.allData.forEach(item => {
        const country = item.country;
        if (!country) return;

        if (!countryData[country]) {
            countryData[country] = [];
        }
        countryData[country].push(item);
    });

    state.countryDataMap = countryData;
    console.log('Countries in data:', Object.keys(countryData));
}

export function getFilteredData(searchTerm = '') {
    let filtered = state.allData;

    if (state.filters.country !== 'all') {
        filtered = filtered.filter(item => item.country === state.filters.country);
    }

    if (state.filters.disease !== 'all') {
        filtered = filtered.filter(item => item.disease === state.filters.disease);
    }

    filtered = filtered.filter(item => {
        if (item.cases === undefined || item.cases === null) {
            return true;
        }
        return item.cases >= state.filters.casesMin && item.cases <= state.filters.casesMax;
    });

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(item => (
            item.location?.toLowerCase().includes(term) ||
            item.country?.toLowerCase().includes(term) ||
            item.disease?.toLowerCase().includes(term) ||
            item.notes?.toLowerCase().includes(term)
        ));
    }

    return filtered;
}
