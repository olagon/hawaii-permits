# CLAUDE.md

Rules for every Claude Code session working on Hawaiʻi Permits. These are copied from `ALA_BUILD.md` sections 1, 8, 16, and 17. Read `PROGRESS.md` first to see where things stand.

Repo root is this folder. Public repo: `olagon/hawaii-permits`. Live site: https://olagon.github.io/hawaii-permits/

Before every push: `npm run validate && npm run build`.

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

---

## 16. Writing rules for all app text and docs

* Simple, clear, friendly words. Short sentences. Write for a local auntie and a first time visitor alike.
* Never use em dashes or en dashes. Hyphens are fine.
* Use "%" instead of the word "percent."
* Say "continent," not "mainland."
* Proper ʻokina and kahakō everywhere.
* Do not sound like a corporate brochure or a chatbot. No hype words.
* Always make clear that Hawaiʻi Permits is not an official government app and that official sources win when they disagree.

---

---

## 17. Quality rules

* **Accessibility**: WCAG 2.2 AA. Real buttons and links, labels on every control, visible focus, works with screen readers, touch targets at least 44 px, color is never the only signal (markers also use shapes or icons).
* **Performance**: first load under 300 KB of JavaScript before the map loads. Lighthouse scores of 90 or higher for performance, accessibility, best practices, and PWA on a mobile profile. Record scores in `PROGRESS.md`.
* **Privacy**: no analytics, no trackers, no ads, no accounts. Nothing the user saves leaves the device.
* **Tests**: unit tests for the planner logic (deduping permits, prerequisites, booking window math across time zones using Pacific/Honolulu), search normalization, and data loading. Playwright tests for home, search, place page, trip planner, and offline mode.
* **Code**: small modules, clear names, JSDoc on public functions, no dead code, no secrets in the repo.

---
