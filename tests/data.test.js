import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CANONICAL_DISEASES,
  DEFAULT_CONFIG,
  getLatestUpdateDate,
  getLegendVisibility,
  getFilterStatusMessage,
  getSafeReferenceUrl,
  getStatusInfo,
  groupItemsByDisease,
  validateEntries,
} from '../js/data.js';

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
    { continued: true, noTransmission: true, endemic: false }
  );

  assert.deepEqual(
    getLegendVisibility(DEFAULT_CONFIG, items, {
      country: 'all',
      disease: 'Mpox Clade I',
      showOutbreaks: true,
      showEndemic: true,
    }),
    { continued: true, noTransmission: false, endemic: false }
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

  assert.equal(errors.includes('Entry 1: use canonical country "Türkiye" instead of "Turkey"'), true);
  assert.equal(errors.includes('Entry 2 (Uganda): invalid lastUpdated "bad-date"'), true);
  assert.equal(errors.includes('Entry 3: duplicate Mpox Clade I + Uganda'), true);
  assert.equal(
    errors.includes('Multiple lastUpdated dates found: 2026-04-01, bad-date, 2026-04-02'),
    true
  );
});

test('rejects non-array data and non-canonical disease names', () => {
  assert.deepEqual(validateEntries('not-an-array'), ['Data "pathogens" must be an array']);

  const errors = validateEntries([
    {
      disease: 'Mpox Clade I',
      country: 'Uganda',
      transmissionStatus: 'Continued Transmission',
      lastUpdated: '2026-04-01',
    },
  ]);

  assert.equal(CANONICAL_DISEASES.includes('Mpox Clade Ia'), true);
  assert.equal(CANONICAL_DISEASES.includes('Mpox Clade Ib'), true);
  assert.equal(errors.includes('Entry 1 (Uganda): non-canonical disease "Mpox Clade I"'), true);
});

test('only permits HTTPS source links', () => {
  assert.equal(getSafeReferenceUrl('https://www.who.int/example'), 'https://www.who.int/example');
  assert.equal(getSafeReferenceUrl('http://example.com'), null);
  assert.equal(getSafeReferenceUrl('javascript:alert(1)'), null);
  assert.equal(getSafeReferenceUrl('not a URL'), null);

  const errors = validateEntries([
    {
      disease: 'Ebola',
      country: 'Uganda',
      transmissionStatus: 'Continued Transmission',
      lastUpdated: '2026-04-01',
      reference: 'javascript:alert(1)',
    },
  ]);

  assert.equal(errors.includes('Entry 1 (Uganda): reference must be a valid HTTPS URL'), true);
});

test('rejects fields outside the documented entry schema', () => {
  const errors = validateEntries([
    {
      disease: 'Ebola',
      location: 'Multiple regions',
      country: 'Uganda',
      transmissionStatus: 'Continued Transmission',
      lastUpdated: '2026-04-01',
      notes: 'Active outbreak',
      reference: 'https://www.who.int/example',
      surveillanceWindow: 21,
    },
  ]);

  assert.equal(errors.includes('Entry 1 (Uganda): unsupported field "surveillanceWindow"'), true);
});

test('explains endemic-only and empty filtered results', () => {
  const items = [
    { country: 'Argentina', disease: 'Andes Virus', transmissionStatus: 'Endemic' },
  ];

  assert.equal(
    getFilterStatusMessage(DEFAULT_CONFIG, items, { disease: 'Andes Virus' }),
    'Andes Virus is currently shown as endemic.'
  );
  assert.equal(
    getFilterStatusMessage(DEFAULT_CONFIG, [], { disease: 'Andes Virus' }),
    'No map entries match these filters.'
  );
  assert.equal(getFilterStatusMessage(DEFAULT_CONFIG, items, {}), '')
});
