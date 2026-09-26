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
