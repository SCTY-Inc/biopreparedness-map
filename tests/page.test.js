import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('all local page assets exist', async () => {
  const paths = Array.from(html.matchAll(/(?:src|href)="((?!https?:|#|mailto:)[^"]+)"/g), (match) => match[1]);
  await Promise.all(paths.map((path) => access(new URL(`../${path}`, import.meta.url))));
});

test('interactive page regions expose their accessible controls', () => {
  assert.match(html, /id="resource-open"/);
  assert.match(html, /id="filter-toggle"[^>]*aria-expanded="false"/s);
  assert.match(html, /class="nav-tab active"[^>]*role="tab"/s);
  assert.match(html, /class="content-tab active"[^>]*role="tab"/s);
  assert.match(html, /id="map-loading"[^>]*role="status"/s);
});
