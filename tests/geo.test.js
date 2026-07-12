import test from 'node:test';
import assert from 'node:assert/strict';

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
