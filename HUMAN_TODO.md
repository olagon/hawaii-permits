# Human to do list

Things only the owner can do. Ala works around each one until it is done. Items are in the order you should do them.

## Now

* **Create the GitHub repo and push.** This session was not allowed to create a public repo or push. Run:

  ```sh
  cd /Library/WebServer/Documents/permits
  gh repo create olagon/ala --public --source=. --push --description "Which permits, licenses, and reservations you need for the outdoors in Hawaiʻi. Not an official government app."
  gh api -X POST repos/olagon/ala/pages -f build_type=workflow
  ```

  The second command turns on GitHub Pages with the Actions source. The first push runs the Validate and Deploy Pages workflows. The site will be at https://olagon.github.io/ala/ a few minutes later. After that, every `git push` to `main` redeploys.

* **Install Xcode and CocoaPods** to build the iOS app locally. The `ios/` project is generated, but it was never compiled here because only Command Line Tools were found. Run `xcode-select -s /Applications/Xcode.app`, then `sudo gem install cocoapods` (or `brew install cocoapods`), then `npx cap sync ios` and `npx cap open ios`.

## Before store release

* **Apple Developer account and App Store Connect record.** Create the app with bundle id `com.kealohalabs.ala`, name "Ala". Then add these repo secrets: `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_API_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_CONTENT` (base64 of the .p8), `MATCH_GIT_URL`, `MATCH_PASSWORD`, `IOS_TEAM_ID`.
* **Google Play Console account and app.** Create the app with package `com.kealohalabs.ala`. Create an upload keystore and add these repo secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `PLAY_SERVICE_ACCOUNT_JSON`. Google requires a closed testing period with at least 12 testers for 14 days before production for new personal developer accounts.
* **Free API keys for richer alerts.** Get an NPS key at https://www.nps.gov/subjects/developer/get-started.htm and a Recreation.gov RIDB key at https://ridb.recreation.gov/. Add them as repo secrets `NPS_API_KEY` and `RIDB_API_KEY`. Until then the alerts job uses only the National Weather Service, which needs no key.

## Optional

* **Capgo live updates.** Installed and disabled. To enable, create an account at https://capgo.app, run `npx @capgo/cli init`, and set `CAPGO_APP_ID` and `CAPGO_API_KEY` as repo secrets. Then set `autoUpdate: true` in `capacitor.config.json` under `CapacitorUpdater`.
* **Cloudflare Worker for no-account edits.** Code is in `worker/`. To deploy: `npm i -g wrangler`, `wrangler login`, create a fine grained GitHub token with Issues write on `olagon/ala`, run `wrangler secret put GITHUB_TOKEN`, then `wrangler deploy`. Then set the worker URL in `app/src/contribute.js`.
* **Custom domain.** Add a `CNAME` file to `app/public/` and set the domain in the repo Pages settings. Change `base` in `vite.config.js` to `/`.
* **Spot check data.** Pick a sample of places, especially private campgrounds, and confirm fees and rules against the owner's site. Open a "report a change" issue for anything wrong.
