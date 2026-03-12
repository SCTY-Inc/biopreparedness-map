#!/usr/bin/env node

/**
 * Pre-deploy validation for data.json against world.geojson.
 * Run: node validate.js
 * Exit code 0 = pass, 1 = errors found.
 */

import { readFileSync } from 'fs';
import {
  GEO_EXEMPT_COUNTRIES,
  canonicalizeCountryName,
  countriesMatch,
  getPointGeometryOverride,
  requiresPointGeometry,
} from './js/geo.js';

const VALID_STATUSES = ['Continued Transmission', 'No Continued Transmission', 'Endemic'];
const REQUIRED_FIELDS = ['disease', 'country', 'transmissionStatus', 'lastUpdated'];

const errors = [];
const warnings = [];

// Load files
const data = JSON.parse(readFileSync('data.json', 'utf8'));
const geo = JSON.parse(readFileSync('assets/world.geojson', 'utf8'));
const entries = data.pathogens || [];

// Build set of GeoJSON country names
const geoNames = new Set();
for (const feature of geo.features) {
  const name =
    feature.properties.NAME ||
    feature.properties.name ||
    feature.properties.NAME_LONG ||
    feature.properties.ADMIN;
  if (name) geoNames.add(name);
}

// Build reverse lookup: data country name → does it resolve to a GeoJSON feature?
function resolves(country) {
  for (const geoName of geoNames) {
    if (countriesMatch(country, geoName)) {
      return true;
    }
  }

  return false;
}

// --- Checks ---

// Required fields
entries.forEach((item, i) => {
  for (const field of REQUIRED_FIELDS) {
    if (!item[field]) {
      errors.push(`Entry ${i + 1}: missing required field "${field}"`);
    }
  }
});

// Valid statuses
entries.forEach((item, i) => {
  if (item.transmissionStatus && !VALID_STATUSES.includes(item.transmissionStatus)) {
    errors.push(
      `Entry ${i + 1} (${item.country}): invalid status "${item.transmissionStatus}"`
    );
  }
});

// Canonical country names
entries.forEach((item, i) => {
  const canonicalCountry = canonicalizeCountryName(item.country);
  if (item.country && canonicalCountry !== item.country) {
    errors.push(
      `Entry ${i + 1}: use canonical country "${canonicalCountry}" instead of "${item.country}"`
    );
  }
});

// Country resolves to GeoJSON
entries.forEach((item, i) => {
  if (
    item.country &&
    !resolves(item.country) &&
    !GEO_EXEMPT_COUNTRIES.has(canonicalizeCountryName(item.country))
  ) {
    errors.push(
      `Entry ${i + 1}: country "${item.country}" not found in GeoJSON. Add to COUNTRY_NAME_MAP?`
    );
  }
});

// Duplicate country+disease
const seen = new Set();
entries.forEach((item, i) => {
  const key = `${item.disease}::${canonicalizeCountryName(item.country)}`;
  if (seen.has(key)) {
    errors.push(`Entry ${i + 1}: duplicate ${item.disease} + ${item.country}`);
  }
  seen.add(key);
});

// Point geometry coverage for exempt countries and regional endemic entries
entries.forEach((item, i) => {
  if (requiresPointGeometry(item) && !getPointGeometryOverride(item)) {
    errors.push(
      `Entry ${i + 1}: "${item.country}" / "${item.location}" needs a point geometry override`
    );
  }
});

// Consistent lastUpdated
const dates = new Set(entries.map((item) => item.lastUpdated).filter(Boolean));
if (dates.size > 1) {
  errors.push(`Multiple lastUpdated dates found: ${[...dates].join(', ')}`);
}

// --- Summary ---

const diseases = new Set(entries.map((e) => e.disease));
const countries = new Set(entries.map((e) => e.country));
const statuses = {};
entries.forEach((e) => {
  statuses[e.transmissionStatus] = (statuses[e.transmissionStatus] || 0) + 1;
});

console.log('\n--- Data Summary ---');
console.log(`Entries:   ${entries.length}`);
console.log(`Diseases:  ${diseases.size} (${[...diseases].join(', ')})`);
console.log(`Countries: ${countries.size}`);
for (const [status, count] of Object.entries(statuses)) {
  console.log(`  ${status}: ${count}`);
}
if (dates.size === 1) {
  console.log(`Date:      ${[...dates][0]}`);
}

if (warnings.length > 0) {
  console.log(`\n--- Warnings (${warnings.length}) ---`);
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
}

if (errors.length > 0) {
  console.log(`\n--- Errors (${errors.length}) ---`);
  errors.forEach((e) => console.log(`  ✗ ${e}`));
  process.exit(1);
} else {
  console.log('\n✓ All checks passed\n');
}
