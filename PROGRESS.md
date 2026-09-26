# Progress

Read this first in every session. Then read `CLAUDE.md`.

## Current phase

Phase 2 and 3: data research (six parallel research agents running), while Phase 4 to 7 code is being built

## Environment (checked 2026-09-25)

| Tool | Status |
|---|---|
| Node | v25.6.1, npm 11.9.0 |
| git | 2.42.1 |
| gh | 2.38.0, logged in as `olagon` |
| Xcode | Missing, only Command Line Tools |
| CocoaPods | Missing |
| Android SDK | Present at `~/Library/Android/sdk`, platforms 35 and 36 |
| JDK | OpenJDK 17 |
| pmtiles CLI | 1.31.2 via Homebrew |
| wrangler | Missing, use `npx wrangler` |

## Done

* Phase 1: repo, `CLAUDE.md`, tracking files, JSON schemas, validate/bundle/links/stale/alerts/tiles scripts, Vite PWA app shell with all screens, hash router, offline data layer, MiniSearch, MapLibre map, trip planner, wallet, reminders, GitHub workflows, issue forms, unit tests (20 passing), Playwright tests written.
* Shared data: 9 agencies and 16 statewide permits (state camping and cabins, day use reservations, forest reserve camping, hunting and fishing licenses, all four county camping permits).
* Capacitor iOS and Android projects added, icons and splash generated, permissions added. Android debug APK builds locally with Java 21: `android/app/build/outputs/apk/debug/app-debug.apk`. Offline tile packs build locally with `npm run tiles` (0.5 to 5 MB per island). Fastlane, store text, privacy page, Cloudflare worker written.

## Next

* Merge research agent output, validate, write Learn content, run e2e, Lighthouse, README screenshots, final audit.

## Known issues

* GitHub repo not created and nothing pushed: the session was not allowed to run `gh repo create --push`. See `HUMAN_TODO.md` first item. Everything is committed locally on `main`.
* iOS simulator build not run (no Xcode).
