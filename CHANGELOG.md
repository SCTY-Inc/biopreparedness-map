# Changelog

This changelog records notable changes to the map's outbreak content, geographic coverage, public guidance, resources, and partner information. Routine corrections made within the same update cycle are grouped with their related content update.

The project did not use release tags during this period, so historical entries are grouped by deployment date and content milestone.

## [Unreleased]

### Changed

- Restored Argentina's Andes Virus entry to `Endemic` and replaced its outbreak notice with the [WHO hantavirus fact sheet](https://www.who.int/news-room/fact-sheets/detail/hantavirus).
- Updated the complete dataset date to July 12, 2026.
- Documented Mpox Clade Ia, Mpox Clade Ib, Avian Influenza H5N1, and Avian Influenza H9N2 as distinct canonical disease names.
- Clarified how overlapping endemic and continued-transmission statuses affect country colors and popup content.

### Removed

- Removed the unused `surveillanceWindow` field from all outbreak records; this field was not displayed on the map.

### Site and data quality

- Added stricter validation for disease names, required fields, source links, duplicate entries, dates, and unsupported data fields.
- Improved donation-dialog accessibility, optimized partner logos, and reduced reliance on third-party runtime assets without changing the page layout.
- Improved mobile filters, active-filter feedback, map loading and empty states, selected-country focus, resource-link behavior, and keyboard-accessible tabs.
- Added unit, static-page, and Playwright browser smoke coverage.

## [2026-06-30] - June outbreak list and partner update

### Added

- Added BlueDot to the partner section ([5af5a4c](https://github.com/SCTY-Inc/biopreparedness-map/commit/5af5a4c)).

### Changed

- Replaced the live dataset with the June Travel Screening Outbreak List ([907b69c](https://github.com/SCTY-Inc/biopreparedness-map/commit/907b69c)).
- Marked Crimean-Congo Hemorrhagic Fever in Afghanistan as `Continued Transmission` ([667a4da](https://github.com/SCTY-Inc/biopreparedness-map/commit/667a4da)).
- Refined Bundibugyo Virus entries and outbreak geography through two June follow-ups ([55f6897](https://github.com/SCTY-Inc/biopreparedness-map/commit/55f6897), [6671802](https://github.com/SCTY-Inc/biopreparedness-map/commit/6671802)).
- Clarified that a final spreadsheet, forwarded email, or PDF may supersede an earlier monthly source ([7c9b8fb](https://github.com/SCTY-Inc/biopreparedness-map/commit/7c9b8fb)).

## [2026-05-22] - Ebola and Bundibugyo outbreak updates

### Changed

- Applied the early-May outbreak data update ([c9b0bf2](https://github.com/SCTY-Inc/biopreparedness-map/commit/c9b0bf2)).
- Updated the Democratic Republic of the Congo Ebola entry ([715ce2d](https://github.com/SCTY-Inc/biopreparedness-map/commit/715ce2d)).
- Added Bundibugyo Virus to the active-disease summary and updated its outbreak records ([b927c1d](https://github.com/SCTY-Inc/biopreparedness-map/commit/b927c1d)).
- Refined Bundibugyo Virus status and geography for Uganda and the Democratic Republic of the Congo across three follow-ups ([3fee51b](https://github.com/SCTY-Inc/biopreparedness-map/commit/3fee51b), [dd1a716](https://github.com/SCTY-Inc/biopreparedness-map/commit/dd1a716), [2dcf7ad](https://github.com/SCTY-Inc/biopreparedness-map/commit/2dcf7ad)).

## [2026-04-24] - Mpox and April outbreak reconciliation

### Changed

- Synchronized Mpox content with the authoritative April email delta ([8e08597](https://github.com/SCTY-Inc/biopreparedness-map/commit/8e08597)).
- Updated the outbreak list from Keira's follow-up and separated Mpox clades according to the confirmed source ([d8ecf5b](https://github.com/SCTY-Inc/biopreparedness-map/commit/d8ecf5b), [ab42b08](https://github.com/SCTY-Inc/biopreparedness-map/commit/ab42b08)).
- Applied and refined the April 23 BioPrep outbreak entries ([1510c3a](https://github.com/SCTY-Inc/biopreparedness-map/commit/1510c3a), [a0dc5b0](https://github.com/SCTY-Inc/biopreparedness-map/commit/a0dc5b0)).
- Standardized pathogen labels and revised Mpox statuses after review ([401551d](https://github.com/SCTY-Inc/biopreparedness-map/commit/401551d)).

### Site and data quality

- Unified browser and command-line validation so the live map and update workflow enforce the same content rules ([bc26656](https://github.com/SCTY-Inc/biopreparedness-map/commit/bc26656)).

## [2026-03-17] - Endemic coverage and regional markers

### Added

- Added Lassa Fever endemic coverage for Burkina Faso.
- Added Marburg endemic coverage for Equatorial Guinea.
- Added endemic Crimean-Congo Hemorrhagic Fever coverage for 30 countries through the March expansion and follow-up.
- Added Nipah Virus endemic coverage for Malaysia, Singapore, and the Philippines ([e5bd34e](https://github.com/SCTY-Inc/biopreparedness-map/commit/e5bd34e), [c8b4030](https://github.com/SCTY-Inc/biopreparedness-map/commit/c8b4030), [5e1bbe2](https://github.com/SCTY-Inc/biopreparedness-map/commit/5e1bbe2)).
- Added Severe Fever with Thrombocytopenia Syndrome and Andes Virus to the tracked diseases ([754c84c](https://github.com/SCTY-Inc/biopreparedness-map/commit/754c84c)).
- Added source links to outbreak records.
- Added map markers for microstates and subnational endemic regions that cannot be represented accurately as whole-country fills ([4735a58](https://github.com/SCTY-Inc/biopreparedness-map/commit/4735a58)).

### Changed

- Corrected new CCHF entries to use `Multiple regions` where the source did not identify a narrower location ([9acd3da](https://github.com/SCTY-Inc/biopreparedness-map/commit/9acd3da)).
- Updated March Mpox and Ebola content and revised About-page attribution following review by Wickliffe, Keira, and Syra ([f61ae71](https://github.com/SCTY-Inc/biopreparedness-map/commit/f61ae71)).
- Removed wording that described the map as “real-time” ([8f5e933](https://github.com/SCTY-Inc/biopreparedness-map/commit/8f5e933)).

### Removed

- Removed a short-lived New York City Mpox point after source review ([906af49](https://github.com/SCTY-Inc/biopreparedness-map/commit/906af49)).

## [2026-02-19] - February outbreak list and content definitions

### Added

- Rebuilt the map from the February Travel Screening Outbreak List ([cb8d0ff](https://github.com/SCTY-Inc/biopreparedness-map/commit/cb8d0ff)).
- Added a repeatable monthly update process based on a final authoritative spreadsheet, email, or PDF ([bd888ca](https://github.com/SCTY-Inc/biopreparedness-map/commit/bd888ca), [a395113](https://github.com/SCTY-Inc/biopreparedness-map/commit/a395113), [46e8d99](https://github.com/SCTY-Inc/biopreparedness-map/commit/46e8d99)).
- Added an archive location for monthly outbreak-list PDFs ([f3cfcf5](https://github.com/SCTY-Inc/biopreparedness-map/commit/f3cfcf5)).

### Changed

- Changed Bangladesh Nipah Virus to `Endemic` and Uganda CCHF to `Continued Transmission` ([f16b5f3](https://github.com/SCTY-Inc/biopreparedness-map/commit/f16b5f3)).
- Corrected Bangladesh's earlier status and moved map geography from record coordinates to maintained country boundaries ([a17e275](https://github.com/SCTY-Inc/biopreparedness-map/commit/a17e275)).
- Changed the headline count to include only diseases with `Continued Transmission`, matching the “Active Outbreak Diseases” label ([7f928e5](https://github.com/SCTY-Inc/biopreparedness-map/commit/7f928e5)).
- Replaced free-form country and disease inputs with dropdowns populated from the current dataset ([eaac38c](https://github.com/SCTY-Inc/biopreparedness-map/commit/eaac38c)).

### Removed

- Removed India from the Nipah travel-screening list before the February full replacement ([2e62489](https://github.com/SCTY-Inc/biopreparedness-map/commit/2e62489)).
- Removed the public data table, case-count slider, and stale case/coordinate fields ([abd4138](https://github.com/SCTY-Inc/biopreparedness-map/commit/abd4138), [a17e275](https://github.com/SCTY-Inc/biopreparedness-map/commit/a17e275)).

## [2026-02-01] - Donation and About content

### Added

- Added a donation dialog explaining how to direct a gift to the System Biopreparedness Program ([fa3514d](https://github.com/SCTY-Inc/biopreparedness-map/commit/fa3514d)).

### Changed

- Reformatted About-page goals and definitions as numbered and bulleted content ([f66ef5d](https://github.com/SCTY-Inc/biopreparedness-map/commit/f66ef5d)).

## [2026-01-30] - Initial map content

### Added

- Launched the map with outbreak and endemic records, country and disease filtering, status definitions, NYC Health + Hospitals branding, and partner information ([579837b](https://github.com/SCTY-Inc/biopreparedness-map/commit/579837b)).
- Added public project, data-update, contact, and local-use documentation ([6a8c1a6](https://github.com/SCTY-Inc/biopreparedness-map/commit/6a8c1a6), [a1cb20c](https://github.com/SCTY-Inc/biopreparedness-map/commit/a1cb20c)).

### Changed

- Updated donation and clinical-resource links, simplified navigation, and standardized an early country name ([3c647f6](https://github.com/SCTY-Inc/biopreparedness-map/commit/3c647f6)).
