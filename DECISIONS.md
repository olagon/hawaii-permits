# Decisions

Choices made without asking the owner, with short reasons. Newest at the bottom.

## Foundation

* **Repo root is `/Library/WebServer/Documents/permits`.** The build instructions were placed here, so this folder is the project folder. The GitHub repo is still named `olagon/ala`.
* **Node 25 is installed, not Node 20.** It is newer than the minimum, so it is fine. CI uses Node 20 to match the spec.
* **Xcode is not installed, only Command Line Tools. CocoaPods is not installed.** The iOS project is generated and committed, but the simulator build is logged in `HUMAN_TODO.md`.
* **pmtiles CLI installed with Homebrew.** It was missing, and Homebrew was available.
* **Tests run with Vitest and Playwright Chromium only.** The spec asks for Chromium with a mobile viewport. Other browsers are not needed.
* **Data validity uses `ajv` in strict mode with `additionalProperties: false`** on every top level object, so typos in field names fail validation.
* **`see_source` is allowed anywhere a number is optional.** Schemas accept either a number or the literal string `see_source` for fees and costs.

## Build and deploy

* **Offline tile packs are built in CI, not committed.** Each pack can be up to 90 MB and there are six islands. Committing them would bloat the repo past 400 MB. `deploy-pages.yml` extracts them from the latest Protomaps daily build and caches them for 30 days. Locally, `npm run tiles` makes them for testing. They are gitignored.
* **The alerts workflow redeploys the whole site.** GitHub Pages deploys a complete artifact, so there is no way to publish only `alerts.json`. The workflow rebuilds from `main` and deploys with a shared `pages` concurrency group so it never races the main deploy. Only the alerts file changes between runs.
* **Protomaps build URL.** The documented `builds.json` index returns 404 now. The tile script probes `https://build.protomaps.com/YYYYMMDD.pmtiles` for the last 10 days instead.
* **Search index is prebuilt with MiniSearch at bundle time** and loaded with `loadJS`. A fallback builds it on the device if the file is missing.
* **Trip sharing encodes the trip in the URL hash** as base64url JSON. No server, nothing uploaded.
* **Web reminders are best effort.** Browsers cannot schedule a future notification without a push server, which would need accounts. On the web Ala shows due reminders when opened and uses the Notification API if allowed. Native apps get real local notifications.
* **Permit categories decide which activities trigger them in the planner.** Camping permits apply only when the user picks camping, hunting licenses only for hunting, and so on. Entry, parking, and trail permits always apply. If no activities are picked, every listed permit is included.
* **Honolulu camping fee is `see_source`.** The only official fee figures found are in a 2013 brochure. The 2023 FAQ confirms the booking window but not the fee.
* **Tile packs are small.** At max zoom 14 the Protomaps daily build gives 0.5 to 5 MB per island, far under the 90 MB limit, so every island ships at zoom 14. The size loop in `make-tiles.sh` stays as a safety net.
* **Android builds need Java 21.** Capacitor 8 targets Java 21. OpenJDK 21 was installed with Homebrew for the local debug build, and the release workflow uses `setup-java` 21.

## Data research (2026-09-25, six parallel research sessions)

* **dlnr.hawaii.gov rate limited (HTTP 429) for most of the research window.** Many individual park, hunting, and reserve pages could not be read directly. Facts for those came from the DLNR index and camping pages that did load, search engine excerpts of the exact DLNR pages, web.archive.org captures of the same URLs, county and federal pages, and owner sites. Sources cite the live DLNR URLs. Every such entry is flagged in the island research reports under `reports/` and should be spot checked by a maintainer when the site is reachable. The monthly refresh workflow exists for this reason.
* **Hurricane closures are recorded as data.** Hurricane Lowell (Kauaʻi, mid September 2026) and Hurricane Lala and Tropical Storm Nolo (Hawaiʻi Island) closed most DLNR lands, several county parks, Kīlauea Point NWR, and parts of Hawaiʻi Volcanoes. Those places carry `status: closed` or `restricted` with a rule naming the storm. They will need re-verification soon, which is why 87 of 426 places are closed today.
* **Papahānaumokuākea, Midway, Kaʻula, and Lehua are filed under the nearest inhabited island** (Papahānaumokuākea and Midway under Kauaʻi, Kaʻula and Lehua under Niʻihau) because the schema needs one island per place.
* **Leads dropped for lack of an official or owner source:** Kahili Mountain Park (domain gone), Kualoa Ranch (day tours only, no camping), Nāhiku bamboo forest, Olivine Pools, Commando Trail, Kīpahulu ʻOhana, Puʻu Kukui preserve, Camp Maluhia and other scout or church camps, Kalani, Kahua Ranch, Wao Kele o Puna, Wailau and Pelekunu landings, Kaʻau Crater, Kolekole Trail (base access only), Mokuʻaeʻae islet.
* **Forest reserves and natural area reserves on Kauaʻi were not written as separate places** because their pages could not be read. Their public use is covered by the trail and hunting unit entries.
* **Nā Ala Hele perimeter, motocross, and duplicate access road rows were skipped or merged** into the parent trail or recreation area.
* **Kamananui Valley Road and the Onomea trails** say a permit or private access is needed in the GIS data, but the issuing party could not be confirmed. Those places tell the user to check with the named foundation or DOFAW instead of listing a permit.
* **Haʻikū Stairs is `removed`** per the build brief. The Oʻahu report notes a court paused the removal work, so `closed` may become more accurate. Either way the entry says do not go.
* **No burial sites were added, and only heiau that DLNR already lists as public parks** (Puʻu O Mahuka, Ulupō, Keaīwa, Halekiʻi-Pihana, Puʻukoholā, and similar) are included.
* **Approximate pins** are marked with the rule "Map pin is approximate." on 120 places, mostly county beach parks, cabins, and hunting unit centroids.
* **Automatic data refresh uses Claude Code in GitHub Actions.** There is no API for most agency pages, so re-verification needs a reader. The workflow is off until the owner adds an API key, and it only opens a pull request, never merges.
