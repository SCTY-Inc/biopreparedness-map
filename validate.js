#!/usr/bin/env node

/**
 * Pre-deploy validation for data.json against world.geojson.
 * Run: node validate.js
 * Exit code 0 = pass, 1 = errors found.
 */

import { readFileSync } from 'fs';
import { validateEntries } from './js/data.js';

const warnings = [];
const data = JSON.parse(readFileSync('data.json', 'utf8'));
const geo = JSON.parse(readFileSync('assets/world.geojson', 'utf8'));
const entries = data.pathogens || [];
const errors = validateEntries(entries, { geoFeatures: geo.features });

const diseases = new Set(entries.map((entry) => entry.disease));
const countries = new Set(entries.map((entry) => entry.country));
const statuses = {};
const dates = new Set(entries.map((entry) => entry.lastUpdated).filter(Boolean));

entries.forEach((entry) => {
  statuses[entry.transmissionStatus] = (statuses[entry.transmissionStatus] || 0) + 1;
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
  warnings.forEach((warning) => console.log(`  ⚠ ${warning}`));
}

if (errors.length > 0) {
  console.log(`\n--- Errors (${errors.length}) ---`);
  errors.forEach((error) => console.log(`  ✗ ${error}`));
  process.exit(1);
}

console.log('\n✓ All checks passed\n');
