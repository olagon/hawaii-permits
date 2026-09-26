// Small fake data set for planner tests. Not real places.
const place = (id, island, extra = {}) => ({ id, name: id, island, land_type: 'state', manager: 'x', location: { lat: 21, lng: -157 }, activities: ['hiking', 'camping'], permits_required: [], status: 'open', sources: ['https://x'], last_verified: '2026-09-01', verified_by: 'maintainer', ...extra });
const permit = (id, extra = {}) => ({ id, name: id, issuer: 'ag', category: 'camping', who_needs: 'x', how_to_get: 'online', url: 'https://x', carry_required: true, sources: ['https://x'], last_verified: '2026-09-01', ...extra });

export function fixture() {
  const permits = [
    permit('state-camp', { booking_window: { opens_days_before: 30, opens_time_local: '00:00' } }),
    permit('county-camp', { booking_window: { opens_days_before: 14, opens_time_local: '09:00' } }),
    permit('day-res', { category: 'entry_reservation', booking_window: { opens_days_before: 30, opens_time_local: '07:00' } }),
    permit('hunt-lic', { category: 'hunting_license', prerequisites: ['hunter-ed'] }),
    permit('hunter-ed', { category: 'hunting_license' }),
    permit('fish-lic', { category: 'fishing_license' }),
    permit('backcountry', { category: 'camping', booking_window: { opens_days_before: 90, opens_time_local: '10:00' } }),
    permit('parking', { category: 'parking' }),
  ];
  const places = [
    place('a', 'oahu', { permits_required: [{ permit: 'state-camp', when: 'To camp.' }, { permit: 'parking', when: 'Nonresidents.' }], max_stay_nights: 3 }),
    place('b', 'oahu', { permits_required: [{ permit: 'state-camp', when: 'To camp.' }] }),
    place('c', 'kauai', { permits_required: [{ permit: 'county-camp', when: 'To camp.' }], hazards: ['flash_flood'] }),
    place('d', 'maui', { permits_required: [{ permit: 'day-res', when: 'Sunrise.' }, { permit: 'backcountry', when: 'Overnight.' }] }),
    place('e', 'hawaii', { activities: ['hunting', 'fishing', 'hiking'], permits_required: [{ permit: 'hunt-lic', when: 'To hunt.' }, { permit: 'fish-lic', when: 'To fish.' }] }),
    place('f', 'oahu', { status: 'closed' }),
    place('g', 'oahu', { status: 'removed' }),
    place('h', 'oahu', { last_verified: '2020-01-01' }),
  ];
  const agencies = [{ id: 'ag', name: 'Agency', level: 'state', website: 'https://x', sources: ['https://x'] }];
  return {
    places, permits, agencies,
    placeById: Object.fromEntries(places.map((p) => [p.id, p])),
    permitById: Object.fromEntries(permits.map((p) => [p.id, p])),
    agencyById: Object.fromEntries(agencies.map((a) => [a.id, a])),
  };
}
