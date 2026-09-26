# Hawaiʻi Permits

Hawaiʻi Permits tells you which permits, licenses, and reservations you need to hike, camp, hunt, fish, or visit outdoor places in Hawaiʻi. State, county, federal, private, nonprofit, and trust land, all in one place.

**Live site:** https://olagon.github.io/hawaii-permits/

Hawaiʻi Permits is a free, open source community project by Kealoha Labs. **It is not an official government app.** When Hawaiʻi Permits and an official source disagree, the official source wins. Always confirm on the official page before you go.

## What it does

* Search any place, with or without ʻokina and kahakō.
* Map of every place by island, colored and shaped by who manages the land.
* Each place lists exactly what you need, how to get it, what it costs, and when booking opens.
* Trip planner builds an ordered checklist for a whole trip, adds prerequisites like hunter education, and reminds you when a booking window opens.
* Permit wallet keeps copies of your permits on your device for showing a ranger with no signal.
* Live weather and park alerts by island.
* Works offline. Installable on your phone as a PWA, and wrapped as iOS and Android apps.

## Screenshots

See `docs/screenshots/`. They are generated with `npm run screenshots`.

## Run it locally

```sh
npm install
npm run dev
```

Other commands:

```sh
npm run validate   # check every data file
npm run build      # bundle data and build the app into dist/
npm test           # unit tests
npm run e2e        # Playwright tests
npm run links      # check every URL in the data
npm run stale      # list entries not verified in 90 days
npm run alerts     # fetch live alerts into app/public/data/alerts.json
npm run tiles      # build offline map packs (needs the pmtiles CLI)
```

## How data updates reach the apps

1. Data lives in `data/` as YAML. Anyone can propose a change with an issue or pull request.
2. On every push to `main`, GitHub Actions validates the data, bundles it into JSON, and deploys the site to GitHub Pages.
3. The web app and the native apps download `manifest.json` on launch. If the version changed, they download the new bundle and store it on the device. No app store release is needed for data changes.
4. Alerts refresh every 3 hours from the National Weather Service and, when keys are set, the National Park Service.
5. Every Monday a workflow checks every link and lists stale entries in a "Weekly data health report" issue.

## Keeping the data fresh

There are four layers, from fully automatic to fully manual:

1. **Alerts, every 3 hours, automatic.** `alerts.yml` pulls National Weather Service alerts (and National Park Service alerts once a key is set) and redeploys `alerts.json`. Nothing to do.
2. **Health report, weekly, automatic.** `weekly-maintenance.yml` checks every link and lists stale entries in a GitHub issue titled "Weekly data health report".
3. **Re-verification, monthly, automatic once a key is set.** `refresh-data.yml` runs Claude Code against `scripts/REFRESH_PROMPT.md`: it re-reads the official source for broken links, closures, and the oldest entries, updates the YAML, and opens a pull request for review. Add the `ANTHROPIC_API_KEY` repo secret to turn it on, or trigger it by hand from the Actions tab with an optional focus like "recheck hurricane closures". Locally the same thing is `npm run refresh` (needs Claude Code installed).
4. **Manual edits.** Edit a YAML file, run `npm run validate`, push. The site rebuilds and every app picks up the new data on next launch.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md). Report a change straight from any place page with the "Suggest an edit" button.

## Licenses

Code: MIT. Data: CC BY 4.0 (see `DATA_LICENSE`). Map data © OpenStreetMap contributors, tiles by OpenFreeMap and Protomaps.
