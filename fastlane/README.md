# Fastlane

Lanes run only from the `release-mobile.yml` workflow when store secrets exist. See `HUMAN_TODO.md` for the secrets list.

* `fastlane ios beta`: signs with match and uploads to TestFlight.
* `fastlane android internal`: builds a signed AAB and uploads to the Play internal testing track.
