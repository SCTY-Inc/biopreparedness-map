// Global state
let map;
let countryLayers = {}; // Store country polygon layers
let allData = [];
let currentFilters = {
    country: 'all',
    disease: 'all',
    casesMin: 1,
    casesMax: 6000,
    showOutbreaks: true,
    showEndemic: true
};

// Comprehensive country name mapping for GeoJSON compatibility
const countryNameMap = {
    // Countries in current dataset
    'Democratic Republic of the Congo': ['Democratic Republic of the Congo', 'DR Congo', 'Congo, Democratic Republic of', 'Congo, the Democratic Republic of the', 'Democratic Republic of Congo'],
    'Congo': ['Republic of the Congo', 'Congo', 'Congo, Republic of'],
    'Tanzania': ['Tanzania', 'Tanzania, United Republic of'],
    'Ethiopia': ['Ethiopia'],
    'Netherlands': ['Netherlands', 'The Netherlands'],
    'Nigeria': ['Nigeria'],
    'Spain': ['Spain'],
    'Uganda': ['Uganda'],
    'Zambia': ['Zambia'],
    'Burundi': ['Burundi'],
    'Kenya': ['Kenya'],
    'Malawi': ['Malawi'],
    'Mozambique': ['Mozambique'],
    'Rwanda': ['Rwanda'],
    'Benin': ['Benin'],
    "Côte d'Ivoire": ["Côte d'Ivoire", "Ivory Coast", "Cote d'Ivoire"],
    'Ghana': ['Ghana'],
    'Guinea': ['Guinea'],
    'Liberia': ['Liberia'],
    'Mali': ['Mali'],
    'Sierra Leone': ['Sierra Leone'],
    'Togo': ['Togo'],
    'Bangladesh': ['Bangladesh'],
    'India': ['India'],
    'Afghanistan': ['Afghanistan'],
    'Iran': ['Iran', 'Iran, Islamic Republic of'],
    'Russia': ['Russian Federation', 'Russia'],
    'Türkiye': ['Türkiye', 'Turkey'],
    'Jordan': ['Jordan'],
    'Kuwait': ['Kuwait'],
    'Oman': ['Oman'],
    'Qatar': ['Qatar'],
    'Saudi Arabia': ['Saudi Arabia'],
    'United Arab Emirates': ['United Arab Emirates', 'UAE'],
    'Yemen': ['Yemen'],
    'Gabon': ['Gabon'],
    'Sudan': ['Sudan'],
    'Angola': ['Angola'],
    'Pakistan': ['Pakistan'],
    // Common variations for other countries
    'United States': ['United States of America', 'United States', 'USA', 'U.S.A.', 'US'],
    'United Kingdom': ['United Kingdom', 'UK', 'U.K.', 'Great Britain'],
    'Russia': ['Russian Federation', 'Russia'],
    'South Korea': ['South Korea', 'Korea, South', 'Korea, Republic of', 'Republic of Korea'],
    'North Korea': ['North Korea', 'Korea, North', "Korea, Democratic People's Republic of"],
    'Myanmar': ['Myanmar', 'Burma'],
    'Ivory Coast': ["Côte d'Ivoire", "Ivory Coast", "Cote d'Ivoire"],
    'Palestine': ['Palestine', 'Palestinian Territory']
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initializeMap();
    initializeCasesSlider();
    setupEventListeners();
    populateFilters();
    updateDataUpdateDate();
    updateDiseaseCount();
    updateLegendVisibility();
    renderTable();
    loadCountryBoundaries();
});

// Initialize noUiSlider for cases filter
function initializeCasesSlider() {
    const sliderEl = document.getElementById('cases-slider');
    if (!sliderEl || typeof noUiSlider === 'undefined') return;

    noUiSlider.create(sliderEl, {
        start: [1, 6000],
        connect: true,
        range: {
            'min': 1,
            'max': 6000
        },
        step: 1,
        format: {
            to: value => Math.round(value),
            from: value => Number(value)
        }
    });

    // Update inputs when slider changes
    sliderEl.noUiSlider.on('update', function(values) {
        const minInput = document.getElementById('cases-min-input');
        const maxInput = document.getElementById('cases-max-input');
        if (minInput) minInput.value = values[0];
        if (maxInput) maxInput.value = values[1];

        currentFilters.casesMin = parseInt(values[0]);
        currentFilters.casesMax = parseInt(values[1]);
    });

    // Apply filters when slider changes end
    sliderEl.noUiSlider.on('change', function() {
        applyFilters();
    });

    // Sync inputs with slider
    const minInput = document.getElementById('cases-min-input');
    const maxInput = document.getElementById('cases-max-input');

    if (minInput) {
        minInput.addEventListener('change', function() {
            sliderEl.noUiSlider.set([this.value, null]);
        });
    }
    if (maxInput) {
        maxInput.addEventListener('change', function() {
            sliderEl.noUiSlider.set([null, this.value]);
        });
    }
}

// Load data from JSON file
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allData = data.pathogens || [];
        console.log(`Data loaded: ${allData.length} pathogen entries`);
        
        if (allData.length === 0) {
            console.warn('No pathogen data found in data.json');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        allData = [];
    }
}

// Initialize Leaflet map
function initializeMap() {
    // Create map with world view
    map = L.map('map', {
        zoomControl: true,
        attributionControl: true,
        minZoom: 2,
        maxZoom: 10
    }).setView([20, 15], 2);

    // Add Carto Positron basemap (light, muted style like reference)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Style the map background
    map.getContainer().style.backgroundColor = '#D8DCDC';
}

// Load country boundaries from a GeoJSON source
async function loadCountryBoundaries() {
    try {
        // Try multiple GeoJSON sources for better compatibility
        const sources = [
            'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
            'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'
        ];
        
        let geoData = null;
        let lastError = null;
        
        for (const source of sources) {
            try {
                const response = await fetch(source);
                if (response.ok) {
                    geoData = await response.json();
                    console.log(`Successfully loaded GeoJSON from: ${source}`);
                    break;
                }
            } catch (err) {
                lastError = err;
                console.warn(`Failed to load from ${source}:`, err);
            }
        }
        
        if (!geoData) {
            throw lastError || new Error('Could not load country boundaries from any source');
        }
        
        // Process data and create country polygons
        processCountryData(geoData);
        updateMapCountries();
    } catch (error) {
        console.error('Error loading country boundaries:', error);
        // Fallback: use markers if GeoJSON fails
        console.log('Falling back to marker-based visualization');
        updateMapMarkers();
    }
}

// Process country data and create mapping
function processCountryData(geoData) {
    // Group data by country
    const countryData = {};
    
    allData.forEach(item => {
        const country = item.country;
        if (!country) return;
        
        if (!countryData[country]) {
            countryData[country] = [];
        }
        countryData[country].push(item);
    });

    // Store country data mapping
    window.countryDataMap = countryData;
    window.geoData = geoData;
    
    // Log available countries from data
    console.log('Countries in data:', Object.keys(countryData));
    console.log('Sample GeoJSON properties:', geoData.features[0]?.properties);
}

// Update map with country polygons
function updateMapCountries() {
    // Clear ALL existing country layers first
    Object.values(countryLayers).forEach(layer => {
        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    });
    countryLayers = {};

    // If both toggles are off, don't show anything
    if (!currentFilters.showOutbreaks && !currentFilters.showEndemic) {
        return;
    }

    if (!window.geoData || !window.countryDataMap) {
        updateMapMarkers();
        return;
    }

    const filtered = getFilteredData();
    const countryStatusMap = {};

    // Determine status for each country
    filtered.forEach(item => {
        if (!item.country) return;

        const country = item.country;
        const status = (item.transmissionStatus || '').toLowerCase();

        // Determine if endemic or outbreak
        const isEndemic = status.includes('endemic');
        const isOutbreak = status.includes('transmission') || status.includes('outbreak');

        // Filter by legend checkboxes - must match at least one enabled category
        if (isEndemic && !currentFilters.showEndemic) return;
        if (isOutbreak && !isEndemic && !currentFilters.showOutbreaks) return;
        if (!isEndemic && !isOutbreak) return; // Unknown status, skip

        // For countries with multiple diseases, prioritize: Continued Transmission > No Continued Transmission > Endemic
        if (!countryStatusMap[country]) {
            countryStatusMap[country] = {
                status: item.transmissionStatus,
                priority: getStatusPriority(item.transmissionStatus)
            };
        } else {
            const currentPriority = countryStatusMap[country].priority;
            const newPriority = getStatusPriority(item.transmissionStatus);
            if (newPriority > currentPriority) {
                countryStatusMap[country] = {
                    status: item.transmissionStatus,
                    priority: newPriority
                };
            }
        }
    });

    // Create polygons for each country
    let matchedCount = 0;
    let unmatchedCountries = [];
    
    window.geoData.features.forEach(feature => {
        // Try multiple property names that different GeoJSON sources might use
        const countryName = feature.properties.NAME || 
                           feature.properties.name || 
                           feature.properties.NAME_LONG ||
                           feature.properties.ADMIN ||
                           feature.properties.NAME_EN ||
                           feature.properties.NAME_ENG ||
                           feature.properties.country ||
                           feature.properties.Country;
        
        if (!countryName) return;
        
        const mappedCountry = findMatchingCountry(countryName, Object.keys(countryStatusMap));
        
        if (mappedCountry && countryStatusMap[mappedCountry]) {
            matchedCount++;
            const status = countryStatusMap[mappedCountry].status;
            const color = getStatusColor(status);
            
            const layer = L.geoJSON(feature, {
                style: {
                    fillColor: color,
                    fillOpacity: 0.7,
                    color: '#333',
                    weight: 1,
                    opacity: 0.8
                },
                onEachFeature: function(feature, layer) {
                    // Create popup with all diseases for this country
                    const countryData = window.countryDataMap[mappedCountry] || [];
                    const filteredCountryData = countryData.filter(item => {
                        const itemStatus = (item.transmissionStatus || '').toLowerCase();
                        const isEndemic = itemStatus.includes('endemic');
                        const isOutbreak = !isEndemic && (itemStatus.includes('transmission') || itemStatus.includes('outbreak'));
                        
                        if (isEndemic && !currentFilters.showEndemic) return false;
                        if (isOutbreak && !currentFilters.showOutbreaks) return false;
                        return true;
                    });

                    if (filteredCountryData.length > 0) {
                        const popupContent = createCountryPopup(filteredCountryData, mappedCountry);
                        layer.bindPopup(popupContent);
                    }
                }
            }).addTo(map);

            countryLayers[mappedCountry] = layer;
        } else if (Object.keys(countryStatusMap).length > 0) {
            // Track unmatched countries for debugging
            unmatchedCountries.push({ geoName: countryName, dataCountries: Object.keys(countryStatusMap) });
        }
    });
    
    console.log(`Matched ${matchedCount} countries out of ${Object.keys(countryStatusMap).length} countries with data`);

    // Log unmatched data countries (countries in our data that couldn't be found in GeoJSON)
    const matchedDataCountries = Object.keys(countryLayers);
    const unmatchedDataCountries = Object.keys(countryStatusMap).filter(c => !matchedDataCountries.includes(c));
    if (unmatchedDataCountries.length > 0) {
        console.warn('Countries in data not matched to GeoJSON:', unmatchedDataCountries);
    }

    // Don't auto-fit bounds - keep the initial view centered on Africa/Middle East
}

// Find matching country name (handles variations)
function findMatchingCountry(geoName, dataCountries) {
    if (!geoName) return null;
    
    // Direct match (case-insensitive)
    const geoLower = geoName.toLowerCase().trim();
    for (const dataCountry of dataCountries) {
        if (dataCountry.toLowerCase().trim() === geoLower) {
            return dataCountry;
        }
    }
    
    // Check mapped names
    for (const dataCountry of dataCountries) {
        const mappings = countryNameMap[dataCountry];
        if (mappings) {
            for (const mappedName of mappings) {
                if (mappedName.toLowerCase().trim() === geoLower) {
                    return dataCountry;
                }
            }
        }
    }
    
    // Reverse check - check if geoName is a key in countryNameMap
    for (const [key, values] of Object.entries(countryNameMap)) {
        if (key.toLowerCase().trim() === geoLower) {
            if (dataCountries.includes(key)) return key;
        }
        for (const value of values) {
            if (value.toLowerCase().trim() === geoLower) {
                if (dataCountries.includes(key)) return key;
            }
        }
    }
    
    // Partial match (contains)
    for (const dataCountry of dataCountries) {
        const dataLower = dataCountry.toLowerCase();
        if (geoLower.includes(dataLower) || dataLower.includes(geoLower)) {
            // Only return if it's a reasonable match (not too short)
            if (Math.min(geoLower.length, dataLower.length) > 5) {
                return dataCountry;
            }
        }
    }
    
    return null;
}

// Get status priority (higher = more important)
function getStatusPriority(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('continued transmission')) return 3;
    if (statusLower.includes('no continued') || statusLower.includes('no transmission')) return 2;
    if (statusLower.includes('endemic')) return 1;
    return 0;
}

// Create popup content for country
function createCountryPopup(countryData, countryName) {
    let html = `<div style="min-width: 250px; font-family: Arial, sans-serif;">`;
    html += `<h3 style="margin: 0 0 10px 0; color: #0072BC; font-size: 16px;">${countryName}</h3>`;
    
    // Group by disease
    const diseases = {};
    countryData.forEach(item => {
        if (!diseases[item.disease]) {
            diseases[item.disease] = [];
        }
        diseases[item.disease].push(item);
    });

    Object.keys(diseases).forEach(disease => {
        const items = diseases[disease];
        html += `<div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #E0E0E0;">`;
        html += `<strong style="color: #333; font-size: 14px;">${disease}</strong>`;
        
        items.forEach(item => {
            html += `<p style="margin: 5px 0; font-size: 12px; color: #666;">`;
            html += `<strong>Status:</strong> ${item.transmissionStatus || 'N/A'}<br>`;
            if (item.location && item.location !== countryName) {
                html += `<strong>Location:</strong> ${item.location}<br>`;
            }
            if (item.lastUpdated) {
                html += `<strong>Last Updated:</strong> ${item.lastUpdated}<br>`;
            }
            if (item.notes) {
                html += `<strong>Notes:</strong> ${item.notes}`;
            }
            html += `</p>`;
        });
        html += `</div>`;
    });
    
    html += `</div>`;
    return html;
}

// Fallback: Update map markers (if GeoJSON fails)
function updateMapMarkers() {
    const filtered = getFilteredData();

    filtered.forEach(item => {
        if (item.latitude && item.longitude) {
            const status = (item.transmissionStatus || '').toLowerCase();
            const isEndemic = status.includes('endemic');
            const isOutbreak = !isEndemic && (status.includes('transmission') || status.includes('outbreak'));

            // Filter by legend checkboxes
            if (isEndemic && !currentFilters.showEndemic) return;
            if (isOutbreak && !currentFilters.showOutbreaks) return;

            const color = getStatusColor(item.transmissionStatus);
            
            const marker = L.circleMarker([item.latitude, item.longitude], {
                radius: 8,
                fillColor: color,
                color: '#333',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.7
            }).addTo(map);

            const popupContent = `
                <div style="min-width: 200px; font-family: Arial, sans-serif;">
                    <h3 style="margin: 0 0 10px 0; color: #0072BC; font-size: 16px;">${item.disease || 'N/A'}</h3>
                    <p style="margin: 5px 0; font-size: 13px;"><strong>Location:</strong> ${item.location || 'N/A'}</p>
                    <p style="margin: 5px 0; font-size: 13px;"><strong>Country:</strong> ${item.country || 'N/A'}</p>
                    <p style="margin: 5px 0; font-size: 13px;"><strong>Status:</strong> ${item.transmissionStatus || 'N/A'}</p>
                    ${item.lastUpdated ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Last Updated:</strong> ${item.lastUpdated}</p>` : ''}
                    ${item.notes ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Notes:</strong> ${item.notes}</p>` : ''}
                </div>
            `;

            marker.bindPopup(popupContent);
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Navigation tabs (Home/About)
    document.querySelectorAll('.nav-tab').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchNavTab(tabName);
        });
    });

    // Content tabs (Map/Data Table/Resources)
    document.querySelectorAll('.content-tab').forEach(button => {
        button.addEventListener('click', (e) => {
            const contentName = e.target.dataset.content;
            switchContentTab(contentName);
        });
    });

    // Country filter
    const countryFilter = document.getElementById('country-filter');
    if (countryFilter) {
        countryFilter.addEventListener('change', (e) => {
            currentFilters.country = e.target.value;
            applyFilters();
        });
    }

    // Disease filter
    const diseaseFilter = document.getElementById('disease-filter');
    if (diseaseFilter) {
        diseaseFilter.addEventListener('change', (e) => {
            currentFilters.disease = e.target.value;
            applyFilters();
        });
    }

    // Clear filters
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            currentFilters = {
                country: 'all',
                disease: 'all',
                casesMin: 1,
                casesMax: 6000,
                showOutbreaks: true,
                showEndemic: true
            };

            const countryFilter = document.getElementById('country-filter');
            const diseaseFilter = document.getElementById('disease-filter');
            const casesSliderEl = document.getElementById('cases-slider');
            const showOutbreaks = document.getElementById('show-outbreaks');
            const showEndemic = document.getElementById('show-endemic');

            if (countryFilter) countryFilter.value = 'all';
            if (diseaseFilter) diseaseFilter.value = 'all';
            if (casesSliderEl && casesSliderEl.noUiSlider) {
                casesSliderEl.noUiSlider.set([1, 6000]);
            }
            if (showOutbreaks) showOutbreaks.checked = true;
            if (showEndemic) showEndemic.checked = true;

            applyFilters();
        });
    }

    // Legend checkboxes
    const showOutbreaks = document.getElementById('show-outbreaks');
    if (showOutbreaks) {
        showOutbreaks.addEventListener('change', (e) => {
            currentFilters.showOutbreaks = e.target.checked;
            updateLegendVisibility();
            updateMapCountries();
        });
    }

    const showEndemic = document.getElementById('show-endemic');
    if (showEndemic) {
        showEndemic.addEventListener('change', (e) => {
            currentFilters.showEndemic = e.target.checked;
            updateLegendVisibility();
            updateMapCountries();
        });
    }
    
    // Initialize legend visibility
    updateLegendVisibility();

    // Table search
    const searchInput = document.getElementById('table-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderTable(e.target.value);
        });
    }

    // Export CSV
    const exportBtn = document.getElementById('export-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }

    // Outbreak list button
    const outbreakBtn = document.getElementById('outbreak-list-btn');
    if (outbreakBtn) {
        outbreakBtn.addEventListener('click', () => {
            alert('Monthly Outbreak List feature coming soon. This would link to the monthly outbreak list.');
        });
    }

    }

// Switch navigation tabs (Home/About)
function switchNavTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Show/hide main tab content
    const homeTab = document.getElementById('home-tab');
    const aboutTab = document.getElementById('about-tab-content');

    if (tabName === 'home') {
        if (homeTab) homeTab.classList.add('active');
        if (aboutTab) aboutTab.classList.remove('active');
    } else if (tabName === 'about') {
        if (homeTab) homeTab.classList.remove('active');
        if (aboutTab) aboutTab.classList.add('active');
    }
}

// Switch content tabs (Map/Data Table/Resources)
function switchContentTab(contentName) {
    // Update content tab buttons
    document.querySelectorAll('.content-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-content="${contentName}"]`).classList.add('active');

    // Update content panels
    document.querySelectorAll('.content-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${contentName}-content`).classList.add('active');

    // Refresh map if switching to map tab
    if (contentName === 'map') {
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 100);
    }
}

// Populate filters
function populateFilters() {
    populateCountryFilter();
    populateDiseaseFilter();
}

// Populate country filter
function populateCountryFilter() {
    const selector = document.getElementById('country-filter');
    if (!selector) return;

    const countries = new Set();
    allData.forEach(item => {
        if (item.country) countries.add(item.country);
    });

    // Clear existing options except "All"
    while (selector.children.length > 1) {
        selector.removeChild(selector.lastChild);
    }

    // Add country options
    Array.from(countries).sort().forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        selector.appendChild(option);
    });
}

// Populate disease filter
function populateDiseaseFilter() {
    const selector = document.getElementById('disease-filter');
    if (!selector) return;

    const diseases = new Set();
    allData.forEach(item => {
        if (item.disease) diseases.add(item.disease);
    });

    // Clear existing options except "All"
    while (selector.children.length > 1) {
        selector.removeChild(selector.lastChild);
    }

    // Add disease options
    Array.from(diseases).sort().forEach(disease => {
        const option = document.createElement('option');
        option.value = disease;
        option.textContent = disease;
        selector.appendChild(option);
    });
}


// Update data update date
function updateDataUpdateDate() {
    const dateEl = document.getElementById('data-update-date');
    if (dateEl) {
        const today = new Date();
        dateEl.textContent = today.toISOString().split('T')[0];
    }
}

// Update disease count
function updateDiseaseCount() {
    const countEl = document.getElementById('disease-count');
    if (countEl) {
        const filtered = getFilteredData();
        const uniqueDiseases = new Set(filtered.map(item => item.disease));
        countEl.textContent = uniqueDiseases.size;
    }
}

// Update legend visibility based on toggle states
function updateLegendVisibility() {
    // Show/hide legend items based on what's being displayed
    const legendContinued = document.getElementById('legend-continued');
    const legendNoTransmission = document.getElementById('legend-no-transmission');
    const legendEndemic = document.getElementById('legend-endemic');
    
    // Check if we have data for each status type in the full dataset (before toggle filtering)
    const hasContinued = allData.some(item => {
        const status = (item.transmissionStatus || '').toLowerCase();
        return status.includes('continued transmission') && !status.includes('no continued');
    });
    const hasNoTransmission = allData.some(item => {
        const status = (item.transmissionStatus || '').toLowerCase();
        return status.includes('no continued') || status.includes('no transmission');
    });
    const hasEndemic = allData.some(item => {
        const status = (item.transmissionStatus || '').toLowerCase();
        return status.includes('endemic');
    });
    
    // Show legend items only if:
    // 1. We have data for that status type in the dataset, AND
    // 2. The corresponding toggle is checked
    if (legendContinued) {
        legendContinued.style.display = (hasContinued && currentFilters.showOutbreaks) ? 'flex' : 'none';
    }
    if (legendNoTransmission) {
        legendNoTransmission.style.display = (hasNoTransmission && currentFilters.showOutbreaks) ? 'flex' : 'none';
    }
    if (legendEndemic) {
        legendEndemic.style.display = (hasEndemic && currentFilters.showEndemic) ? 'flex' : 'none';
    }
}

// Apply all filters
function applyFilters() {
    updateLegendVisibility();
    updateMapCountries();
    updateDiseaseCount();
    renderTable();
}

// Get filtered data
function getFilteredData(searchTerm = '') {
    let filtered = allData;

    // Filter by country
    if (currentFilters.country !== 'all') {
        filtered = filtered.filter(item => item.country === currentFilters.country);
    }

    // Filter by disease
    if (currentFilters.disease !== 'all') {
        filtered = filtered.filter(item => item.disease === currentFilters.disease);
    }

    // Filter by cases range (only if item has cases defined)
    filtered = filtered.filter(item => {
        // If no cases field, include the item (endemic regions often don't have case counts)
        if (item.cases === undefined || item.cases === null) {
            return true;
        }
        return item.cases >= currentFilters.casesMin && item.cases <= currentFilters.casesMax;
    });

    // Filter by search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(item => {
            return (
                item.location?.toLowerCase().includes(term) ||
                item.country?.toLowerCase().includes(term) ||
                item.disease?.toLowerCase().includes(term) ||
                item.notes?.toLowerCase().includes(term)
            );
        });
    }

    return filtered;
}

// Get color for transmission status - EXACT COLORS FROM IMAGE
function getStatusColor(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('endemic')) return '#86CC9F'; // Light green/mint
    if (statusLower.includes('no continued') || statusLower.includes('no transmission')) return '#5078A1'; // Dark teal/blue
    if (statusLower.includes('continued')) return '#F28B46'; // Orange
    return '#95a5a6'; // Default gray
}

// Get CSS class for status
function getStatusClass(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('endemic')) return 'endemic';
    if (statusLower.includes('no continued') || statusLower.includes('no transmission')) return 'no-transmission';
    if (statusLower.includes('continued')) return 'continued-transmission';
    return '';
}

// Render data table
function renderTable(searchTerm = '') {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;

    const filtered = getFilteredData(searchTerm);

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No data available</td></tr>';
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
        tbody.appendChild(row);
    });
}

// Export to CSV
function exportToCSV() {
    const filtered = getFilteredData();
    
    // CSV headers
    const headers = ['Disease', 'Location', 'Country', 'Transmission Status', 'Last Updated', 'Notes', 'Latitude', 'Longitude'];
    
    // CSV rows
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

    // Combine headers and rows
    const csv = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `special-pathogens-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
