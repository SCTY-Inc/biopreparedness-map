# NYC Health + Hospitals Special Pathogens Biopreparedness Map

Interactive map tracking global disease outbreaks and endemic regions for the NYC Health + Hospitals System Biopreparedness Program.

**Live site:** https://biopreparednessmap.org

## Quick start

```bash
npm install
npm run build:css
npm start
```

Open http://localhost:8000 (needs `python3`).

## Verification

`npm run check` builds CSS, validates the dataset, and runs the Node tests.

## Data updates

Monthly updates come from the final Travel Screening Outbreak List (Google Sheet, email, or PDF). Run `npm run check` before committing. See `AGENTS.md` for the workflow. Archived source documents are under `sources/`.

## Licenses

Code is licensed under Apache License 2.0. The outbreak dataset is licensed under CC BY 4.0; see `DATA-LICENSE.md` for attribution details.

## Contact

SystemBiopreparedness@nychhc.org
