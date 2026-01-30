# Agents Guide

Instructions for AI agents working on the Biopreparedness Map.

## Quick Context

- Static site (HTML/JS/CSS) - no build step
- Data-driven map visualization
- Config-driven UI via `config.json`
- Monthly data updates from epidemiology team
- Hosted on Cloudflare Pages, auto-deploys from GitHub

## Agent Tasks

### Data Update Agent

**Trigger:** Monthly or when new outbreak reported

**Steps:**

1. Read current `data.json`
2. Add/update pathogen entries
3. Validate JSON structure
4. Commit with message: `Update data: [disease] in [country]`
5. Push to trigger deploy
6. Check the data error banner for validation issues

**Validation checks:**

- Required fields: `disease`, `country`, `transmissionStatus`
- `transmissionStatus` must be: `Continued Transmission`, `No Continued Transmission`, or `Endemic`
- Country names should match existing entries or GeoJSON

### Map Debug Agent

**Trigger:** Country not appearing on map

**Steps:**

1. Check if country exists in `data.json`
2. Check console for "Countries in data not matched to GeoJSON" warning
3. Add country mapping to `COUNTRY_NAME_MAP` in `js/config.js`
4. Test locally before pushing

### Deployment Agent

**Trigger:** Changes need to go live

**Steps:**

1. Verify changes work locally (open `index.html` in browser)
2. Stage specific files: `git add [files]`
3. Commit with descriptive message
4. Push to `main` branch
5. Verify at https://biopreparednessmap.org (may take 1-2 min)

## File Ownership

| File          | Edit Frequency | Agent Access |
| ------------- | -------------- | ------------ |
| `data.json`   | Monthly        | Full         |
| `app.js`      | Rare           | With review  |
| `js/`         | Rare           | With review  |
| `config.json` | Rare           | With review  |
| `schema.json` | Rare           | With review  |
| `index.html`  | Rare           | With review  |
| `styles.css`  | Rare           | With review  |
| `assets/`     | Rare           | Add only     |

## Guardrails

- Never delete existing data entries without explicit approval
- Always validate JSON before commit
- Test filter toggles after data changes
- Don't modify map tile provider or attribution
- Keep partner logos in `assets/` directory

## Testing Checklist

Before pushing changes:

- [ ] Map loads without console errors
- [ ] All countries in data appear on map
- [ ] Filters work (country, disease, cases slider)
- [ ] Toggle checkboxes show/hide correctly
- [ ] Popups display on country click
- [ ] Data table shows filtered results

## Rollback

If something breaks:

```bash
git revert HEAD
git push
```

Or revert to specific commit:

```bash
git log --oneline -5
git revert [commit-hash]
git push
```
