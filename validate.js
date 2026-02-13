#!/usr/bin/env node

/**
 * Pre-deploy validation for data.json against world.geojson.
 * Run: node validate.js
 * Exit code 0 = pass, 1 = errors found.
 */

import { readFileSync } from 'fs';

const VALID_STATUSES = ['Continued Transmission', 'No Continued Transmission', 'Endemic'];
const REQUIRED_FIELDS = ['disease', 'country', 'transmissionStatus'];

// Country name map (must stay in sync with js/config.js)
const COUNTRY_NAME_MAP = {
  'Democratic Republic of the Congo': [
    'DR Congo',
    'Congo, Democratic Republic of',
    'Congo, the Democratic Republic of the',
    'Democratic Republic of Congo',
  ],
  Congo: ['Republic of the Congo', 'Congo, Republic of'],
  Tanzania: ['United Republic of Tanzania', 'Tanzania, United Republic of'],
};

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
  if (geoNames.has(country)) return true;
  const variants = COUNTRY_NAME_MAP[country];
  if (variants) {
    for (const v of variants) {
      if (geoNames.has(v)) return true;
    }
  }
  // Check if any variant list contains this name
  for (const [key, variants] of Object.entries(COUNTRY_NAME_MAP)) {
    for (const v of variants) {
      if (v === country && geoNames.has(key)) return true;
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

// Country resolves to GeoJSON
entries.forEach((item, i) => {
  if (item.country && !resolves(item.country)) {
    errors.push(
      `Entry ${i + 1}: country "${item.country}" not found in GeoJSON. Add to COUNTRY_NAME_MAP?`
    );
  }
});

// Duplicate country+disease
const seen = new Set();
entries.forEach((item, i) => {
  const key = `${item.disease}::${item.country}`;
  if (seen.has(key)) {
    errors.push(`Entry ${i + 1}: duplicate ${item.disease} + ${item.country}`);
  }
  seen.add(key);
});

// Consistent lastUpdated
const dates = new Set(entries.map((item) => item.lastUpdated).filter(Boolean));
if (dates.size > 1) {
  warnings.push(`Multiple lastUpdated dates found: ${[...dates].join(', ')}`);
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
