# Progress

Read this first in every session. Then read `CLAUDE.md`.

## Current phase

All 8 phases done on 2026-09-25 (one build session). See the final summary below. The only open items are things only the owner can do (`HUMAN_TODO.md`), starting with creating the GitHub repo and pushing.

## Environment (checked 2026-09-25)

| Tool | Status |
|---|---|
| Node | v25.6.1, npm 11.9.0 |
| git | 2.42.1 |
| gh | 2.38.0, logged in as `olagon` (but this session was not allowed to create the repo or push) |
| Xcode | Missing, only Command Line Tools. iOS simulator build not run. |
| CocoaPods | Missing |
| Android SDK | Present, platforms 35 and 36 |
| JDK | OpenJDK 17 and 21 (Capacitor 8 needs 21) |
| pmtiles CLI | 1.31.2 via Homebrew |
| wrangler | Missing, use `npx wrangler` |

## Final summary

### What was built

* **Data layer**: 426 places, 65 permits, 30 agencies as YAML under `data/`, validated by strict JSON Schemas (`schema/`). Every entry cites official or owner sources with `last_verified: 2026-09-25`.
* **Build layer**: `validate`, `bundle` (JSON bundles plus a prebuilt MiniSearch index and a versioned manifest), `links`, `stale`, `alerts` (NWS live, NPS and RIDB when keys exist, DLNR news RSS), `tiles` (PMTiles island packs from Protomaps). Six GitHub workflows: validate on push, deploy Pages on `main`, alerts every 3 hours, weekly health report issue, monthly Claude Code data refresh (needs a key), and mobile release on tags with secret-gated store uploads.
* **App layer**: Vite PWA in vanilla JS with hash routing. Screens: Home, Map (MapLibre, OpenFreeMap online, PMTiles offline packs, land type shapes and colors, filters, near me, bottom sheet), Search (ʻokina and kahakō insensitive), Place, Permit, Trip Planner (dedupe, prerequisites, booking windows in Pacific/Honolulu, warnings, share links), Permit Wallet (on device only), Reminders, Alerts, Learn (7 pages), About and Contribute, Privacy, Settings (theme, island, offline packs, data refresh, clear data). Data downloads on launch when the manifest version changes and is cached in IndexedDB; a copy ships in the build.
* **Mobile**: Capacitor iOS and Android projects committed, native plugins wired in `native.js` with web fallbacks, icons and splash generated from an original SVG, permissions added, Capgo installed but off. Android debug APK builds: `android/app/build/outputs/apk/debug/app-debug.apk`. Fastlane lanes, store listing text, and privacy policy in `store/`.
* **Contribution**: three issue forms, prefilled "Suggest an edit" links, `CONTRIBUTING.md` with templates, Cloudflare Worker in `worker/` (not deployed).

### Live URL

https://olagon.github.io/ala/ once the owner creates the repo and pushes (first item in `HUMAN_TODO.md`).

### Data counts

| Island | Places |
|---|---|
| Oʻahu | 108 |
| Kauaʻi | 89 |
| Maui | 68 |
| Molokaʻi | 25 |
| Lānaʻi | 15 |
| Hawaiʻi Island | 117 |
| Niʻihau | 3 |
| Kahoʻolawe | 1 |

| Land type | Places |
|---|---|
| State | 305 |
| County | 43 |
| Federal | 34 |
| Private | 22 |
| Nonprofit | 14 |
| Mixed | 5 |
| Military | 3 |

Status: 269 open, 87 closed (mostly September 2026 hurricane closures), 51 restricted, 14 no public access, 3 seasonal, 2 removed. 376 places carry a verified NWS zone. 120 pins are marked approximate.

Coverage against section 9 of the build brief: every DLNR state park on all islands, every State Parks and DOFAW campground and cabin that could be confirmed, all 152 Nā Ala Hele GIS trail rows (merged or skipped where duplicates), every county campground in all four counties, all 9 NPS units and their permits, national wildlife refuges, hunting units on every island, freshwater and the nonresident marine fishing license, private and nonprofit camps confirmed from owner sites, and the special areas (Kahoʻolawe, Kalaupapa, Papahānaumokuākea, offshore islet sanctuaries, marine life conservation districts). Gaps are listed in `DECISIONS.md` under "Data research".

### Test results

* Unit: 20 passing (planner with 11 trip cases, booking window time zone math, search normalization, bundle integrity).
* End to end (Playwright, Pixel 7 profile): 6 passing (home, search with and without ʻokina, place page, trip planner, wallet, offline mode).
* Lighthouse mobile on the home screen: performance 95, accessibility 100, best practices 100. Lighthouse 12 no longer has a PWA category; the app has a manifest, service worker, and installs.
* Initial JavaScript before the map loads: about 22 KB (8 KB gzipped). The map chunk (1.1 MB) loads only on the Map screen.
* Android debug build: passes. iOS: not compiled here (no Xcode); the release workflow runs a simulator build on macOS runners.

### Known gaps

* Repo not created and nothing pushed (permission denied in this session). Pages, workflows, and the live URL start working after the owner's first push.
* Many DLNR pages were rate limited during research (HTTP 429). Facts from those pages came from search excerpts, archive captures, and index pages. See each `reports/research-*.md`. The monthly refresh workflow is designed to close this gap.
* Hurricane closures from September 2026 will go stale quickly.
* Honolulu camping fee, most DOFAW campsite fees, Hāʻena reservation window, and several private rates are `see_source`.
* Offline map packs are built in CI, not committed. The first deploy builds them.
* Web reminders only fire when the app is open. Native apps get real local notifications.

## Known issues

* `npm run links` reports DLNR and a few booking sites as "unverified" because they rate limit or block bots. That is expected, not broken.
