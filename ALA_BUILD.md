# Ala Build Instructions for Claude Code

Read this whole file before doing anything. Then build the entire project from start to finish without asking the owner any questions.

Owner: Olin Lagon (GitHub user `olagon`), publishing as Kealoha Labs.

---

## 0. Mission

Build **Ala**, a free, open source app that tells anyone exactly which permits, licenses, and reservations they need to hike, camp, hunt, fish, or visit any outdoor place in Hawaiʻi. It covers state, county, federal, private, nonprofit, and trust land in one place.

Ala has three layers.

1. **Data layer.** Plain YAML files in `/data`, one file per place, permit, and agency. This is the source of truth.
2. **Build layer.** Scripts and GitHub Actions validate the data, bundle it into JSON, and deploy the web app to GitHub Pages.
3. **App layer.** One web app (installable PWA) that is also wrapped with Capacitor into iOS and Android projects. The app downloads the latest data bundle from GitHub Pages on launch and caches it for offline use, so data updates never need an app store release.

---

## 1. Autonomy rules (most important section)

1. **Never ask the owner a question.** When something is unclear, pick the most reasonable option, write it down in `DECISIONS.md` with one or two sentences of reasoning, and keep going.
2. **Never stop because of a blocker.** If something needs the owner (accounts, passwords, paid keys, signing certificates, hardware), write it in `HUMAN_TODO.md`, build everything around it so it works the moment the owner adds it, and move on.
3. **Stay resumable.** Keep `PROGRESS.md` updated after every meaningful step. It lists the current phase, what is done, what is next, and any known issues. If a session ends, a new session must be able to read `PROGRESS.md` and continue with no help.
4. **Commit and push often.** Small commits with clear messages. Push to `main` after each working step. Never leave the repo in a broken state at the end of a step. Run `npm run validate` and `npm run build` before every push.
5. **Create `CLAUDE.md` first.** Copy sections 1, 8, 16, and 17 of this file into `CLAUDE.md` at the repo root so every future session follows the same rules.
6. **Never invent facts.** If you cannot confirm a fee, date, phone number, or rule from an official or owner source, do not guess. Use `see_source` or leave the optional field out. See section 8.
7. **Test your own work.** After each phase, run the app, run tests, fix what breaks, and review your own code before moving on.
8. **Work through the phases in order** (section 19). Finish each phase's definition of done before starting the next.
9. **Do not delete the owner's files** outside this project folder. Work only inside the project folder.
10. **Finish with a handoff.** When all phases are done, write the final summary described in section 20 and stop.

---

## 2. Environment setup

At the start, check what is installed and record the results in `PROGRESS.md`.

* Node.js 20 or newer and npm. If missing, log it in `HUMAN_TODO.md` and stop only if nothing can be built.
* git. Set up the repo locally even if GitHub push fails.
* GitHub CLI `gh`. Run `gh auth status`. If authenticated, create the public repo `olagon/ala` with `gh repo create olagon/ala --public --source=. --push`. If not authenticated, keep working locally and add "Run `gh auth login`, then push" to `HUMAN_TODO.md`.
* Xcode and CocoaPods (for iOS). If missing, still generate everything you can and log the gap.
* Android Studio, JDK 17 or newer, and Android SDK (for Android). If present, build a debug APK. If missing, log the gap.

Enable GitHub Pages with the Actions source using `gh api` if `gh` is authenticated. The site will live at `https://olagon.github.io/ala/`. Set the Vite `base` to `/ala/`.

---

## 3. Tech stack (use these, do not debate them)

| Area | Choice |
|---|---|
| Build tool | Vite |
| Language | Vanilla JavaScript (ES modules) with JSDoc types. No React, no Vue, no Angular. |
| Styling | Plain CSS with custom properties. Mobile first. Light and dark themes. |
| Map | MapLibre GL JS |
| Online tiles | OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`) |
| Offline tiles | Per island PMTiles files made with the `pmtiles` CLI, loaded with the `pmtiles` JS library |
| Search | MiniSearch |
| Offline app shell | Workbox service worker via `vite-plugin-pwa` |
| Local storage on device | IndexedDB via `idb-keyval` |
| Data format | YAML in repo, JSON bundles at build time |
| Validation | `ajv` with JSON Schema |
| Unit tests | Vitest |
| End to end tests | Playwright (Chromium, mobile viewport) |
| Link checking | Custom Node script using `fetch` with retries |
| Mobile wrapper | Capacitor (current stable major version) |
| Capacitor plugins | Geolocation, Local Notifications, Filesystem, Share, Preferences, Network, App, Splash Screen, Status Bar |
| Icons and splash | `@capacitor/assets` |
| Store automation | Fastlane config, run only when secrets exist |
| Live code updates | Capgo, set up but disabled until the owner adds credentials |

---

## 4. Repo layout

```
ala/
├── CLAUDE.md
├── PROGRESS.md
├── DECISIONS.md
├── HUMAN_TODO.md
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE                  (MIT, code)
├── DATA_LICENSE             (CC BY 4.0, data)
├── data/
│   ├── places/<island>/<place-id>.yaml
│   ├── permits/<permit-id>.yaml
│   ├── agencies/<agency-id>.yaml
│   ├── islands.yaml
│   ├── activities.yaml
│   └── alert-sources.yaml
├── schema/
│   ├── place.schema.json
│   ├── permit.schema.json
│   └── agency.schema.json
├── scripts/
│   ├── validate.js
│   ├── build-bundle.js
│   ├── check-links.js
│   ├── stale-report.js
│   ├── fetch-alerts.js
│   └── make-tiles.sh
├── app/
│   ├── index.html
│   ├── src/
│   │   ├── main.js
│   │   ├── router.js
│   │   ├── data.js
│   │   ├── search.js
│   │   ├── map.js
│   │   ├── planner.js
│   │   ├── wallet.js
│   │   ├── reminders.js
│   │   ├── alerts.js
│   │   ├── native.js
│   │   ├── views/
│   │   └── styles/
│   └── public/
│       ├── icons/
│       └── tiles/
├── tests/
│   ├── unit/
│   └── e2e/
├── ios/
├── android/
├── fastlane/
├── worker/                  (Cloudflare Worker for no-account edits, not deployed)
└── .github/
    ├── workflows/
    └── ISSUE_TEMPLATE/
```

---

## 5. Data model

Write strict JSON Schemas for each file type. Every schema must reject unknown top level fields so typos get caught.

### 5.1 Place

Required fields:

* `id` (kebab case, matches file name)
* `name` (with correct ʻokina and kahakō)
* `island` (enum: `oahu`, `kauai`, `niihau`, `maui`, `molokai`, `lanai`, `kahoolawe`, `hawaii`)
* `land_type` (enum: `state`, `county`, `federal`, `private`, `private_nonprofit`, `trust`, `military`, `mixed`)
* `manager` (an agency id or a plain name for private owners)
* `location` with `lat` and `lng`
* `activities` (array of ids from `activities.yaml`)
* `permits_required` (array, can be empty). Each item has `permit` (permit id) and `when` (plain words explaining when it applies)
* `status` (enum: `open`, `closed`, `seasonal`, `restricted`, `no_public_access`, `removed`)
* `sources` (array of URLs, at least one)
* `last_verified` (date)
* `verified_by` (enum: `maintainer`, `owner`, `agency`, `community`, `ai_research`)

Optional fields: `moku`, `ahupuaa`, `aliases`, `summary`, `booking` (`method`, `url`, `phone`, `window_note`), `fees` (numbers or `see_source`), `rules` (array of plain sentences), `hazards` (enum array: `flash_flood`, `stream_crossings`, `falling_rock`, `high_surf`, `steep_drop`, `mud`, `heat`, `cold`, `altitude`, `hunting_area`, `no_water`, `remote`), `alerts` (`nws_zone`, `nps_park_code`), `amenities`, `accessibility`, `max_stay_nights`, `group_size_limit`, `cultural_notes`, `photo` (only if free license with credit), `owner_claimed` (boolean).

### 5.2 Permit

Required fields: `id`, `name`, `issuer` (agency id), `category` (enum: `camping`, `cabin`, `day_use`, `parking`, `trail_access`, `vehicle_access`, `hunting_license`, `hunting_tag`, `fishing_license`, `gathering`, `commercial`, `special_use`, `entry_reservation`), `who_needs`, `how_to_get` (enum: `online`, `in_person`, `phone`, `mail`, `owner_direct`), `url`, `carry_required` (boolean), `sources`, `last_verified`.

Optional fields: `covers` (place ids), `booking_window` with `opens_days_before`, `opens_time_local`, and `notes`, `resident_rules`, `cost` (with `resident`, `nonresident`, numbers or `see_source`), `valid_for`, `refund_policy`, `age_minimum`, `prerequisites` (other permit ids, for example hunter education before a hunting license).

### 5.3 Agency

Required fields: `id`, `name`, `level` (enum: `state`, `county`, `federal`, `private`, `nonprofit`, `trust`), `website`, `sources`.

Optional fields: `phone`, `email`, `reservation_system_url`, `islands`.

---

## 6. Build scripts

* `npm run validate` runs `scripts/validate.js`. It checks every YAML file against its schema, checks that every referenced permit id and agency id exists, checks that file names match ids, checks lat and lng fall inside the Hawaiian Islands bounding box, and warns (not fails) on any `last_verified` older than 90 days.
* `npm run bundle` runs `scripts/build-bundle.js`. It writes `app/public/data/manifest.json` (version hash and date), `places.json`, `permits.json`, `agencies.json`, and one `places-<island>.json` per island. It also writes a prebuilt MiniSearch index.
* `npm run links` runs `scripts/check-links.js`. It checks every URL with retries and a polite delay, and writes `reports/links.md`.
* `npm run stale` writes `reports/stale.md` listing everything not verified in 90 days.
* `npm run alerts` runs `scripts/fetch-alerts.js` (section 12).
* `npm run tiles` runs `scripts/make-tiles.sh` (section 11).
* `npm run dev`, `npm run build`, `npm test`, `npm run e2e` do the usual.

---

## 7. App features and screens

The app is a single page app with hash routing so it works on GitHub Pages and inside Capacitor.

### 7.1 Home
* Island picker (remembers choice).
* Active alerts for the chosen island.
* "Booking windows opening soon" for saved places.
* Quick search box.
* Entry points to Map, Plan a Trip, Wallet, Learn.

### 7.2 Map
* All places for the island as markers, colored by `land_type`, with a legend.
* Filter chips for activity, land type, status, and "no permit needed".
* Tap a marker to open a bottom sheet with name, status, permits needed, and a button to the full page.
* "Near me" using geolocation.
* Closed, removed, and no public access places show with a clear warning color and no directions.

### 7.3 Search
* Instant search across place names, aliases, permits, and agencies.
* Works with or without ʻokina and kahakō (search "kaena" finds "Kaʻena").

### 7.4 Place page
* Name, island, land type, manager, status banner.
* "What you need" section listing each permit with when it applies, how to get it, cost, booking window, and a button to the official booking page.
* Rules, hazards, amenities, max stay, cultural notes.
* Sources list and "Last verified" date. Show "May be out of date, check the official source" when older than 90 days.
* Buttons for Save, Share, Add to Trip, Suggest an Edit.

### 7.5 Permit page
* Full permit details, all places it covers, prerequisites, and official link.

### 7.6 Trip Planner (the main feature)
* User adds places, picks activities for each, and picks dates.
* The app builds an ordered checklist of every permit, license, and reservation needed, removing duplicates and adding prerequisites.
* For each item, it shows when booking opens based on `booking_window` and the trip dates. If the window is not open yet, it shows the exact opening date and offers a reminder.
* Warnings for closed places, max stay limits, and hazards like flash flood risk.
* Trips save on the device. Trips can be shared as a link that encodes the trip in the URL.

### 7.7 Permit Wallet
* User adds a photo, screenshot, or PDF of a permit, tied to a trip or place.
* Stored only on the device in IndexedDB (web) or Filesystem (native). Never uploaded anywhere.
* Works fully offline. Big, easy to show to a ranger.

### 7.8 Reminders
* Local notifications on native. On web, show in app reminders and use the Notification API when allowed.
* Types: booking window opens, trip starting soon (check alerts), permit expiring.

### 7.9 Alerts
* Reads `alerts.json` from the site (section 12) and shows alerts by island and by place.

### 7.10 Learn
* Short, plain language pages on being pono outdoors, respecting cultural sites and gathering rights, flash flood safety, what to carry, and how land type decides who gives the permit.
* Write this content from official DLNR, NPS, and county safety guidance, in your own words, with sources listed.

### 7.11 About and Contribute
* What Ala is, that it is not an official government app, data license, how to contribute, and a thank you list of contributors.

### 7.12 Settings
* Island, theme, offline downloads per island, clear data, notification settings.

---

## 8. Data research rules

Use web search and web fetch to research every entry. Follow these rules exactly.

1. **Official sources first.** DLNR (Division of State Parks, Division of Forestry and Wildlife, Division of Aquatic Resources), each county parks department, the National Park Service, Recreation.gov, U.S. Fish and Wildlife Service, the Hawaiʻi Statewide GIS Program, and the owner's own website for private places.
2. **Never copy** text, photos, reviews, or listings from Hipcamp, AllTrails, Yelp, TripAdvisor, Google Maps reviews, or any other private listing or review site. You may use them only as leads to find the owner's official site. Write all descriptions in your own words.
3. **Never invent.** If a fee, phone number, booking window, or rule cannot be confirmed from an official or owner source, use `see_source` or leave the optional field out.
4. **Every entry cites its sources** in `sources` and sets `last_verified` to the research date and `verified_by: ai_research`.
5. **Coordinates** come from official GIS data or the official site. If only approximate, round to 3 decimal places and add a rule line saying the pin is approximate.
6. **Closed and dangerous places.** Include well known closed, removed, or no access trails and areas (for example ones on private or military land, or trails the state has closed or removed) with the correct `status`, a short plain explanation, and no route directions. The goal is to stop people from going, not to guide them there.
7. **Cultural care.** Do not publish locations of burial sites, heiau that are not already public destinations, or other sensitive cultural sites. When in doubt, leave it out and log it in `DECISIONS.md`.
8. **Correct spelling.** Use proper ʻokina (ʻ, U+02BB) and kahakō on all Hawaiian names, matching the official agency spelling or Ulukau place name references.
9. **Rules change often.** Prefer linking to official pages over copying detailed numbers.

---

## 9. Coverage targets

Aim for complete coverage. Minimum targets before calling the data phase done:

* **Every state park, state recreation area, and state wayside** with a place file, including day use reservation parks.
* **Every DLNR campground and cabin** (State Parks and Forestry and Wildlife).
* **Every Nā Ala Hele trail** listed on DLNR's trail pages, plus forest reserve access roads that need a permit.
* **Every county beach park that allows camping** on all four counties, plus county parks that need reservations.
* **Every national park unit in Hawaiʻi** and each permit or reservation it uses (campgrounds, cabins, backcountry permits, entry reservations).
* **National wildlife refuges** with public access rules.
* **Hunting**: hunting license, hunter education prerequisite, and game management units with public hunting access.
* **Fishing**: freshwater fishing license, plus a Learn page explaining that saltwater rules are set by species and area and linking to DAR. Verify current saltwater license rules before writing.
* **Private, nonprofit, church, ranch, trust, and concessionaire campgrounds and cabins** on every island that accept the public.
* **Special access areas** such as Kahoʻolawe, Kalaupapa, and Papahānaumokuākea, with their access rules.

### 9.1 Research leads to verify

These are starting leads only. Confirm each one from an official or owner source before adding it. Drop any lead you cannot confirm and note it in `DECISIONS.md`.

**Reservation and permit systems**
* State camping and cabins: camping.ehawaii.gov
* State park day use and parking reservations: gostateparks.hawaii.gov
* Hāʻena State Park reservations: gohaena.com
* DLNR permit hub: outdoor.hawaii.gov
* DLNR Forestry and Wildlife permits: dlnr.hawaii.gov/dofaw/permits
* DLNR official outdoor app info: dlnr.hawaii.gov/dofaw/app
* Hunting and freshwater fishing licenses: DLNR and eHawaiʻi licensing pages
* City and County of Honolulu camping permits: official Honolulu parks camping site
* Maui County, Kauaʻi County, and Hawaiʻi County camping permits: each county's official parks site
* Federal campgrounds and entry reservations: recreation.gov

**Oʻahu leads**: Mālaekahana, Ahupuaʻa o Kahana, Keaīwa Heiau, Sand Island, Kaʻena Point, Diamond Head, Kuliʻouʻou, Poamoho (4x4 permit), Bellows Field Beach Park, Kualoa Regional Park, Hoʻomaluhia Botanical Garden, Camp Mokulēʻia, YMCA Camp Erdman, Haʻikū Stairs (removed), Sacred Falls (closed).

**Kauaʻi leads**: Nāpali Coast Wilderness (Kalalau, Hanakoa, Miloliʻi), Hāʻena, Kōkeʻe cabins and campgrounds, Polihale, Anini Beach Park, Haʻena Beach Park, Hanalei Black Pot, Salt Pond, Lydgate, YWCA Camp Sloggett, Kahili Mountain Park.

**Maui leads**: Haleakalā (summit sunrise reservation, Hosmer Grove, Kīpahulu campground, wilderness cabins, backcountry permits), Waiʻānapanapa, ʻĪao Valley, Polipoli Spring, Camp Olowalu, Papalaua Wayside.

**Molokaʻi leads**: Pālāʻau State Park, Papohaku Beach Park, Kalaupapa (access rules).

**Lānaʻi leads**: Hulopoʻe Beach Park camping.

**Hawaiʻi Island leads**: Hawaiʻi Volcanoes (Kulanaokuaiki, Nāmakanipaio, backcountry permits), Hāpuna Beach A frame shelters, Kīholo, MacKenzie, Kalōpā, Waimanu (Muliwai Trail), Mauna Kea access rules, Puʻuwaʻawaʻa, Hawaiʻi County beach parks with camping such as Spencer, Hoʻokena, and Punaluʻu.

**Special areas**: Kahoʻolawe (Protect Kahoʻolawe ʻOhana access), Papahānaumokuākea (federal and state permits), offshore seabird sanctuaries with landing rules.

### 9.2 Open data to pull
* Hawaiʻi Statewide GIS Program open layers (state parks, forest reserves, trails, natural area reserves, game management units). Use them for coordinates and boundaries.
* NWS API for alerts and zones.
* NPS API and Recreation.gov RIDB API (both need free keys, see section 12).

Record final counts per island and category in `PROGRESS.md`.

---

## 10. Offline behavior

* The service worker caches the app shell on first load.
* `data.js` fetches `manifest.json`. If the version changed, it downloads the new bundles and stores them in IndexedDB. If offline, it uses the stored copy. Bundle a copy of the data inside the app build so a fresh install works with no network.
* Show "Data updated <date>" in Settings.
* Everything except live alerts and online map tiles must work in airplane mode.

---

## 11. Maps and offline tiles

* Online: MapLibre with the OpenFreeMap style.
* Offline: `scripts/make-tiles.sh` uses the `pmtiles` CLI to extract one PMTiles file per inhabited island from the latest Protomaps daily build. Start at max zoom 14. If any file is over 90 MB, lower the max zoom for that island until it fits (GitHub has a 100 MB file limit).
* Put tile files in `app/public/tiles/`. In Settings, the user can download an island pack, which the app saves for offline use. When offline, the map switches to the saved pack.
* If the `pmtiles` CLI cannot be installed, log it in `HUMAN_TODO.md` and ship online tiles with service worker caching of viewed tiles.
* Include map attribution for OpenStreetMap, OpenFreeMap, and Protomaps.

---

## 12. Alerts pipeline

`scripts/fetch-alerts.js` runs nightly and every 3 hours in GitHub Actions and writes `alerts.json` to the Pages site.

* **NWS**: fetch `https://api.weather.gov/alerts/active?area=HI` with a proper User-Agent that includes the repo URL. Map alerts to places using `alerts.nws_zone` and island.
* **NPS**: if the secret `NPS_API_KEY` exists, fetch alerts for Hawaiʻi park codes. If not, skip quietly and note it in `HUMAN_TODO.md`.
* **Recreation.gov RIDB**: if the secret `RIDB_API_KEY` exists, refresh federal facility info. If not, skip.
* **DLNR closures**: DLNR has no closures API. Check DLNR news feeds if a public RSS feed exists. If not, closures stay manual through data files.
* Never let a failed alert fetch break the site. Keep the last good `alerts.json`.

---

## 13. Contribution flow

* GitHub issue forms in `.github/ISSUE_TEMPLATE/`: `add-place.yml`, `report-change.yml`, `owner-claim.yml`. Each field has an `id` so the app can prefill it.
* The "Suggest an Edit" button opens `https://github.com/olagon/ala/issues/new?template=report-change.yml` with the place id and name prefilled through URL query parameters.
* Owner claims ask for proof of ownership (official website or email on the official domain). Claimed places get `owner_claimed: true` and `verified_by: owner` once a maintainer approves.
* `worker/` holds a Cloudflare Worker that accepts a simple form and creates a GitHub issue with a bot token, for people without GitHub accounts. Write it, test it locally with Wrangler if available, but do not deploy. Add deploy steps to `HUMAN_TODO.md`.
* `CONTRIBUTING.md` explains in plain words how to add or fix a place, with a copy and paste YAML template.

---

## 14. Mobile apps (Capacitor)

* App name: **Ala**. Bundle id: `com.kealohalabs.ala`.
* Run `npx cap add ios` and `npx cap add android`. Commit the `ios/` and `android/` folders.
* `native.js` detects Capacitor and uses native plugins, falling back to web APIs in the browser.
* Native features that must work in version 1.0 (these help with Apple's rule against apps that are only a website): offline permit wallet using Filesystem, local notifications for booking windows, geolocation "near me", native share sheet, offline island map packs, and network status banner.
* Generate icons and splash screens with `@capacitor/assets` from a simple original icon you design as SVG (a trail path forming a gentle curve, in deep green and ocean blue). Do not use any existing logo or art.
* Android: if the SDK is present, build a debug APK with `./gradlew assembleDebug` and note its path in `PROGRESS.md`.
* iOS: if Xcode is present, run a simulator build to confirm it compiles.
* Capgo live updates: install and configure, but keep it off until the owner adds credentials. Document in `HUMAN_TODO.md`.
* Write store listing text in `store/` (short description, full description, keywords, privacy answers). The privacy answer is that Ala collects no personal data, has no accounts, no tracking, and no ads.
* Write `store/PRIVACY.md` and publish it as a page on the site, since both stores require a privacy policy URL.

---

## 15. GitHub Actions workflows

* `validate.yml`: on every push and pull request, run validate, unit tests, and build.
* `deploy-pages.yml`: on push to `main`, bundle data, build the app, run Playwright smoke tests, and deploy to GitHub Pages.
* `alerts.yml`: on a schedule, run `fetch-alerts.js` and redeploy only the alerts file.
* `weekly-maintenance.yml`: weekly link check and stale report. Open or update a single GitHub issue titled "Weekly data health report" with the results.
* `release-mobile.yml`: on tags like `v1.0.0`, build the web app, sync Capacitor, and run Fastlane lanes for TestFlight and Play Console internal testing. Every step must check for its secrets first and skip with a clear message if missing, so the workflow never fails just because store accounts are not set up yet.

---

## 16. Writing rules for all app text and docs

* Simple, clear, friendly words. Short sentences. Write for a local auntie and a first time visitor alike.
* Never use em dashes or en dashes. Hyphens are fine.
* Use "%" instead of the word "percent."
* Say "continent," not "mainland."
* Proper ʻokina and kahakō everywhere.
* Do not sound like a corporate brochure or a chatbot. No hype words.
* Always make clear that Ala is not an official government app and that official sources win when they disagree.

---

## 17. Quality rules

* **Accessibility**: WCAG 2.2 AA. Real buttons and links, labels on every control, visible focus, works with screen readers, touch targets at least 44 px, color is never the only signal (markers also use shapes or icons).
* **Performance**: first load under 300 KB of JavaScript before the map loads. Lighthouse scores of 90 or higher for performance, accessibility, best practices, and PWA on a mobile profile. Record scores in `PROGRESS.md`.
* **Privacy**: no analytics, no trackers, no ads, no accounts. Nothing the user saves leaves the device.
* **Tests**: unit tests for the planner logic (deduping permits, prerequisites, booking window math across time zones using Pacific/Honolulu), search normalization, and data loading. Playwright tests for home, search, place page, trip planner, and offline mode.
* **Code**: small modules, clear names, JSDoc on public functions, no dead code, no secrets in the repo.

---

## 18. Licenses and docs

* `LICENSE`: MIT for code.
* `DATA_LICENSE`: CC BY 4.0 for data, with a note that agency and owner sources are credited in each file.
* If any OpenStreetMap data is ever stored in `/data`, keep it in a separate folder under ODbL and note it.
* `README.md`: what Ala is, screenshots (generate them with Playwright), live site link, how to run locally, how to contribute, how data updates reach the apps, and the "not an official government app" notice.

---

## 19. Phases

### Phase 1. Foundation
Repo, `CLAUDE.md`, tracking files, schemas, scripts, CI, empty app shell deployed to Pages.
**Done when** validate, build, and deploy all pass and the Pages site loads.

### Phase 2. Oʻahu data and core app
All Oʻahu places and permits per section 9. Home, Map, Search, Place page, Permit page, offline data.
**Done when** every Oʻahu entry validates, the app works offline, and e2e tests pass.

### Phase 3. All islands
Full data for every other island and special area.
**Done when** coverage targets in section 9 are met or each gap is explained in `DECISIONS.md`.

### Phase 4. Trip Planner, Wallet, Reminders
**Done when** the planner produces correct checklists for at least 10 test trips you write as unit tests, including multi island trips and trips that need prerequisites.

### Phase 5. Alerts and offline maps
**Done when** alerts show on the right places and island packs work in airplane mode.

### Phase 6. Contribution flow
Issue forms, prefilled edit links, Worker code, `CONTRIBUTING.md`.
**Done when** the edit button opens a correctly prefilled issue form.

### Phase 7. Mobile
Capacitor projects, native features, icons, store text, privacy page, release workflow.
**Done when** the Android debug build and iOS simulator build succeed where the tools exist, and everything else is logged.

### Phase 8. Polish and audit
Lighthouse, accessibility review, full data link check, stale report, README screenshots, final self review of all code.
**Done when** all quality targets in section 17 are met.

---

## 20. Final handoff

When Phase 8 is done:

1. Update `PROGRESS.md` with a final summary: what was built, the live URL, data counts per island and category, test results, Lighthouse scores, and known gaps.
2. Make sure `HUMAN_TODO.md` lists, in plain words and in order, everything the owner must do to ship to the stores. Expected items include:
   * Log in to GitHub CLI if that was missing.
   * Create or confirm the Apple Developer account and App Store Connect app record.
   * Create or confirm the Google Play Console account and app, and run any required closed testing period.
   * Create signing keys and add store secrets to the GitHub repo.
   * Get free NPS and Recreation.gov RIDB API keys and add them as repo secrets.
   * Optional: set up Capgo, deploy the Cloudflare Worker, and add a custom domain.
   * Spot check a sample of data entries, especially private places.
3. Tag the release `v1.0.0` and push.
4. Stop.
