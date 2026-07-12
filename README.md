# NYC Health + Hospitals Special Pathogens Biopreparedness Map

Interactive map tracking global disease outbreaks and endemic regions for the NYC Health + Hospitals System Biopreparedness Program.

**Live site:** https://biopreparednessmap.org

## Quick start

```bash
npm install
npm run build:css
npm start
```

Open http://localhost:8000.

## Verification

Run `npm run check` to build CSS, validate the dataset, and run the Node tests.

For interaction or layout changes, smoke-test the local site in a real browser. Agents should use `dev-browser` at desktop and mobile viewport sizes.

## Data updates

Monthly updates come from the Travel Screening Outbreak List (Google Sheet or forwarded email/PDF—whichever carries the final authoritative country list). Run `npm run check` before committing. See `AGENTS.md` for the full workflow.

Authoritative source documents retained for audit history are organized by year under `sources/`.

## Licenses

Code is licensed under Apache License 2.0. The outbreak dataset is licensed under CC BY 4.0; see `DATA-LICENSE.md` for attribution details.

## Contact

SystemBiopreparedness@nychhc.org
