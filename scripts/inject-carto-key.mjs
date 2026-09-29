#!/usr/bin/env node
// Replaces the __CARTO_API_KEY__ placeholder in js/data.js with CARTO_API_KEY
// from the environment. Runs as the Cloudflare Pages build command so the raw
// key never lands in git history. Local dev (npm start) serves the
// placeholder as-is; tiles are referer-restricted to biopreparednessmap.org
// anyway, so localhost never got real tiles either way.
import { readFileSync, writeFileSync } from 'node:fs';

const PLACEHOLDER = '__CARTO_API_KEY__';
const TARGET = new URL('../js/data.js', import.meta.url);

const key = process.env.CARTO_API_KEY;
if (!key) {
  console.log('CARTO_API_KEY not set; leaving placeholder in js/data.js.');
  process.exit(0);
}

const before = readFileSync(TARGET, 'utf8');
if (!before.includes(PLACEHOLDER)) {
  console.log('No CARTO_API_KEY placeholder found in js/data.js; nothing to inject.');
  process.exit(0);
}

writeFileSync(TARGET, before.split(PLACEHOLDER).join(key));
console.log('Injected CARTO_API_KEY into js/data.js.');
