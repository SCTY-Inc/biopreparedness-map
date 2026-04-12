import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_CONFIG,
  getLatestUpdateDate,
  getLegendVisibility,
  getStatusInfo,
  groupItemsByDisease,
  validateEntries,
} from '../js/data.js';
import {
  canonicalizeCountryName,
  countriesMatch,
  getPointGeometryOverride,
  requiresPointGeometry,
} from '../js/geo.js';

test('canonicalizes mapped country variants', () => {
  assert.equal(canonicalizeCountryName('Turkey'), 'Türkiye');
  assert.equal(canonicalizeCountryName('Macedonia'), 'North Macedonia');
});

test('matches canonical and variant country names symmetrically', () => {
  assert.equal(countriesMatch('Türkiye', 'Turkey'), true);
  assert.equal(countriesMatch('Turkey', 'Türkiye'), true);
  assert.equal(countriesMatch('North Macedonia', 'Macedonia'), true);
});

test('requires point geometry for exempt countries and regional endemic entries', () => {
  assert.equal(
    requiresPointGeometry({
      country: 'Singapore',
      transmissionStatus: 'Endemic',
      location: 'Multiple regions',
    }),
    true
  );

  assert.equal(
    requiresPointGeometry({
      country: 'China',
      transmissionStatus: 'Endemic',
      location: 'Northwestern/Xinjiang',
    }),
    true
  );
});

test('resolves point geometry overrides for microstates and subnational endemic zones', () => {
  assert.deepEqual(
    getPointGeometryOverride({
      country: 'Singapore',
      disease: 'Nipah Virus',
      transmissionStatus: 'Endemic',
      location: 'Multiple regions',
    })?.coordinates,
    [1.3521, 103.8198]
  );

  assert.deepEqual(
    getPointGeometryOverride({
      country: 'Russia',
      disease: 'Crimean-Congo Hemorrhagic Fever',
      transmissionStatus: 'Endemic',
      location: 'Southern endemic foci',
    })?.coordinates,
    [44.8, 43.3]
  );
});

test('parses transmission status into the correct UI flags', () => {
  assert.deepEqual(getStatusInfo(DEFAULT_CONFIG, 'Continued Transmission'), {
    key: 'continued',
    isEndemic: false,
    isOutbreak: true,
    isContinued: true,
    isNoTransmission: false,
  });

  assert.deepEqual(getStatusInfo(DEFAULT_CONFIG, 'Endemic'), {
    key: 'endemic',
    isEndemic: true,
    isOutbreak: false,
    isContinued: false,
    isNoTransmission: false,
  });
});

test('legend visibility follows the currently visible dataset', () => {
  const items = [
    { country: 'Uganda', disease: 'Mpox Clade I', transmissionStatus: 'Continued Transmission' },
    { country: 'Kenya', disease: 'Rift Valley Fever', transmissionStatus: 'No Continued Transmission' },
    { country: 'India', disease: 'Nipah Virus', transmissionStatus: 'Endemic' },
  ];

  assert.deepEqual(
    getLegendVisibility(DEFAULT_CONFIG, items, {
      country: 'all',
      disease: 'all',
      showOutbreaks: true,
      showEndemic: false,
    }),
    {
      continued: true,
      noTransmission: true,
      endemic: false,
    }
  );

  assert.deepEqual(
    getLegendVisibility(DEFAULT_CONFIG, items, {
      country: 'all',
      disease: 'Mpox Clade I',
      showOutbreaks: true,
      showEndemic: true,
    }),
    {
      continued: true,
      noTransmission: false,
      endemic: false,
    }
  );
});

test('latest update date returns null instead of fabricating today', () => {
  assert.equal(getLatestUpdateDate([{ lastUpdated: '' }, { lastUpdated: 'not-a-date' }]), null);
  assert.equal(
    getLatestUpdateDate([{ lastUpdated: '2026-02-01' }, { lastUpdated: '2026-03-17' }]),
    '2026-03-17'
  );
});

test('popup grouping stays grouped by disease', () => {
  const groups = groupItemsByDisease([
    { disease: 'Mpox Clade I', country: 'Uganda' },
    { disease: 'Ebola', country: 'Uganda' },
    { disease: 'Mpox Clade I', country: 'Burundi' },
  ]);

  assert.deepEqual(
    groups.map((group) => ({ disease: group.disease, count: group.items.length })),
    [
      { disease: 'Ebola', count: 1 },
      { disease: 'Mpox Clade I', count: 2 },
    ]
  );
});

test('shared validator enforces the same contract in browser and CLI', () => {
  const geoFeatures = [
    { properties: { NAME: 'Türkiye' } },
    { properties: { NAME: 'Uganda' } },
  ];

  const errors = validateEntries(
    [
      {
        disease: 'Mpox Clade I',
        country: 'Turkey',
        transmissionStatus: 'Continued Transmission',
        lastUpdated: '2026-04-01',
        location: 'Multiple regions',
      },
      {
        disease: 'Mpox Clade I',
        country: 'Uganda',
        transmissionStatus: 'Endemic',
        lastUpdated: 'bad-date',
        location: 'Multiple regions',
      },
      {
        disease: 'Mpox Clade I',
        country: 'Uganda',
        transmissionStatus: 'Endemic',
        lastUpdated: '2026-04-02',
        location: 'Multiple regions',
      },
    ],
    { geoFeatures }
  );

  assert.equal(
    errors.includes('Entry 1: use canonical country "Türkiye" instead of "Turkey"'),
    true
  );
  assert.equal(
    errors.includes('Entry 2 (Uganda): invalid lastUpdated "bad-date"'),
    true
  );
  assert.equal(errors.includes('Entry 3: duplicate Mpox Clade I + Uganda'), true);
  assert.equal(
    errors.includes('Multiple lastUpdated dates found: 2026-04-01, bad-date, 2026-04-02'),
    true
  );
});
