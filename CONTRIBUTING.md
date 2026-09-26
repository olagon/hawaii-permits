# Contributing to Ala

Thank you for helping. The easiest way to help is to report a wrong fee, a closure, or a missing place with a GitHub issue. If you are comfortable with GitHub, you can also edit the data files directly.

## The easy way

Open an issue with one of these forms:

* [Add a place](https://github.com/olagon/ala/issues/new?template=add-place.yml)
* [Report a change](https://github.com/olagon/ala/issues/new?template=report-change.yml)
* [Claim a place you own or manage](https://github.com/olagon/ala/issues/new?template=owner-claim.yml)

A maintainer will check the official source and update the data.

## Editing data yourself

All data lives in `data/` as YAML files. One file per place, permit, and agency.

* Places: `data/places/<island>/<place-id>.yaml`
* Permits: `data/permits/<permit-id>.yaml`
* Agencies: `data/agencies/<agency-id>.yaml`

Rules:

1. Only use official sources: the agency, the county, the National Park Service, or the owner's own website. Never copy text from review or listing sites.
2. Never guess a fee, phone number, or rule. Use `see_source` or leave the field out.
3. Use proper ʻokina (ʻ) and kahakō (ā ē ī ō ū) in Hawaiian names.
4. Set `last_verified` to today and `verified_by` to `community`.
5. Do not add burial sites or other sensitive cultural places.
6. Run `npm run validate` before opening a pull request.

### Place template

```yaml
id: example-beach-park            # kebab case, same as the file name
name: Example Beach Park
island: oahu                      # oahu, kauai, niihau, maui, molokai, lanai, kahoolawe, hawaii
land_type: county                 # state, county, federal, private, private_nonprofit, trust, military, mixed
manager: honolulu-parks           # an agency id from data/agencies, or a plain name for a private owner
location: { lat: 21.000, lng: -157.000 }
activities: [camping, swimming, day_use]
permits_required:
  - permit: honolulu-camping-permit
    when: To camp overnight. Camping is only allowed Friday through Wednesday nights.
status: open                      # open, closed, seasonal, restricted, no_public_access, removed
summary: One or two plain sentences about the place.
booking:
  method: online
  url: https://example.gov/booking
  window_note: Permits go on sale two weeks before the first night.
fees:
  camping_per_night: see_source
rules:
  - No alcohol.
hazards: [high_surf]
amenities: [restrooms, showers]
max_stay_nights: 5
sources:
  - https://example.gov/parks/example-beach-park
last_verified: 2026-09-25
verified_by: community
```

### Permit template

```yaml
id: example-camping-permit
name: Example County camping permit
issuer: example-parks             # agency id
category: camping                 # camping, cabin, day_use, parking, trail_access, vehicle_access, hunting_license, hunting_tag, fishing_license, gathering, commercial, special_use, entry_reservation
who_needs: Anyone camping overnight at a county beach park.
how_to_get: online                # online, in_person, phone, mail, owner_direct
url: https://example.gov/camping
carry_required: true
booking_window:
  opens_days_before: 30
  opens_time_local: "09:00"
  notes: Permits are sold up to 30 days ahead.
cost:
  resident: 0
  nonresident: see_source
  unit: per person per night
sources:
  - https://example.gov/camping
last_verified: 2026-09-25
```

### Agency template

```yaml
id: example-parks
name: Example County Department of Parks and Recreation
level: county                     # state, county, federal, private, nonprofit, trust
website: https://example.gov/parks
phone: 808-000-0000
reservation_system_url: https://example.gov/camping
islands: [oahu]
sources:
  - https://example.gov/parks
```

## Code changes

Run `npm install`, then `npm run dev`. Run `npm test` and `npm run e2e` before a pull request. Keep modules small and add JSDoc to public functions. Follow the writing rules in `CLAUDE.md`: plain words, no em dashes, proper ʻokina and kahakō.
