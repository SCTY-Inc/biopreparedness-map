export let dom = {};

export function initDom() {
  dom = {
    navTabs: document.querySelectorAll('.nav-tab'),
    contentTabs: document.querySelectorAll('.content-tab'),
    contentPanels: document.querySelectorAll('.content-panel'),
    homeTab: document.getElementById('home-tab'),
    aboutTab: document.getElementById('about-tab-content'),
    countryFilter: document.getElementById('country-filter'),
    diseaseFilter: document.getElementById('disease-filter'),
    countryOptions: document.getElementById('country-options'),
    diseaseOptions: document.getElementById('disease-options'),
    casesSlider: document.getElementById('cases-slider'),
    casesMinInput: document.getElementById('cases-min-input'),
    casesMaxInput: document.getElementById('cases-max-input'),
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
    tableBody: document.getElementById('table-body'),
    tableSearch: document.getElementById('table-search'),
    exportCsv: document.getElementById('export-csv'),
    resourceSelect: document.getElementById('resource-select'),
    dataErrorBanner: document.getElementById('data-error-banner'),
    dataErrorMessage: document.getElementById('data-error-message'),
    siteTitle: document.getElementById('site-title'),
    siteSubtitle: document.getElementById('site-subtitle'),
    footerText: document.getElementById('footer-text'),
    rowsPerPageSelect: document.getElementById('rows-per-page'),
    pageInfo: document.getElementById('page-info'),
    pageCount: document.getElementById('page-count'),
    pagePrev: document.getElementById('page-prev'),
    pageNext: document.getElementById('page-next'),
  };

  return dom;
}
