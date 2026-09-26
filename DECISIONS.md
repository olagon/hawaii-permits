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
