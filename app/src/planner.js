// Trip planner logic. Pure functions, no DOM, so they are easy to test.
// A trip: { id, name, stops: [{ place, activities: [], start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }] }

const HST_OFFSET_HOURS = 10; // Pacific/Honolulu is UTC-10 all year, no daylight saving.

/** Which permit categories apply only when the user picked a matching activity. */
const CATEGORY_ACTIVITY = {
  camping: ['camping'], cabin: ['cabin'], hunting_license: ['hunting'], hunting_tag: ['hunting'],
  fishing_license: ['fishing'], gathering: ['gathering'], vehicle_access: ['four_wheel_drive', 'scenic_drive'],
  commercial: [],
};

/** Add days to a YYYY-MM-DD date string. */
export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Nights between two YYYY-MM-DD dates. */
export const nightsBetween = (start, end) => Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 86400000));

/** ISO instant for a Hawaiʻi local date and HH:MM time. */
export function hstInstant(dateStr, time = '00:00') {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + HST_OFFSET_HOURS, mm)).toISOString();
}

/**
 * When booking opens for a permit and a stop start date.
 * @returns {{ state: 'anytime'|'open'|'not_yet', opensAt?: string, opensOn?: string }}
 */
export function bookingStatus(permit, startDate, now = Date.now()) {
  const w = permit.booking_window;
  if (!w || w.opens_days_before == null) return { state: 'anytime', note: w?.notes };
  const opensOn = addDays(startDate, -w.opens_days_before);
  const opensAt = hstInstant(opensOn, w.opens_time_local || '00:00');
  return { state: Date.parse(opensAt) <= now ? 'open' : 'not_yet', opensAt, opensOn, note: w.notes };
}

function permitApplies(permit, activities) {
  const needs = CATEGORY_ACTIVITY[permit.category];
  if (!needs) return true;
  if (!activities?.length) return true;
  return needs.some((a) => activities.includes(a));
}

/**
 * Build the ordered checklist for a trip.
 * @param {object} trip
 * @param {{placeById:object, permitById:object, agencyById:object}} data
 * @param {number} [now]
 * @returns {{ items: Array, warnings: Array, islands: string[] }}
 */
export function buildChecklist(trip, data, now = Date.now()) {
  const items = new Map();
  const warnings = [];
  const islands = new Set();

  const addPermit = (permitId, stop, place, when, viaPrereq) => {
    const permit = data.permitById[permitId];
    if (!permit) return;
    let item = items.get(permitId);
    if (!item) {
      item = { permit, stops: [], whens: [], earliestStart: null, prerequisiteFor: [] };
      items.set(permitId, item);
    }
    if (place && !item.stops.some((s) => s.place.id === place.id)) item.stops.push({ place, start: stop.start, end: stop.end });
    if (when && !item.whens.includes(when)) item.whens.push(when);
    if (viaPrereq && !item.prerequisiteFor.includes(viaPrereq)) item.prerequisiteFor.push(viaPrereq);
    if (stop.start && (!item.earliestStart || stop.start < item.earliestStart)) item.earliestStart = stop.start;
    for (const pre of permit.prerequisites || []) addPermit(pre, stop, null, null, permit.name);
  };

  for (const stop of trip.stops || []) {
    const place = data.placeById[stop.place];
    if (!place) { warnings.push({ level: 'warn', text: `A saved place (${stop.place}) is no longer in the data.` }); continue; }
    islands.add(place.island);
    if (place.status !== 'open') {
      const words = { closed: 'is closed', removed: 'has been removed and is not open to the public', no_public_access: 'has no public access', restricted: 'has restricted access', seasonal: 'is only open part of the year' };
      warnings.push({ level: place.status === 'seasonal' || place.status === 'restricted' ? 'warn' : 'danger', place: place.id, text: `${place.name} ${words[place.status] || place.status}. Check the official source before going.` });
    }
    const nights = stop.start && stop.end ? nightsBetween(stop.start, stop.end) : 0;
    if (place.max_stay_nights && nights > place.max_stay_nights) warnings.push({ level: 'warn', place: place.id, text: `${place.name} allows up to ${place.max_stay_nights} nights. Your stop is ${nights} nights.` });
    for (const h of place.hazards || []) {
      if (h === 'flash_flood') warnings.push({ level: 'warn', place: place.id, text: `${place.name} has flash flood risk. Check the weather before you go and never cross a rising stream.` });
      if (h === 'hunting_area') warnings.push({ level: 'warn', place: place.id, text: `${place.name} is in a hunting area. Wear bright colors and stay on the trail.` });
      if (h === 'no_water') warnings.push({ level: 'warn', place: place.id, text: `${place.name} has no drinking water. Bring all you need.` });
      if (h === 'remote') warnings.push({ level: 'warn', place: place.id, text: `${place.name} is remote with no cell service. Tell someone your plan.` });
    }
    if (daysSince(place.last_verified) > 90) warnings.push({ level: 'info', place: place.id, text: `${place.name} data was last checked on ${place.last_verified}. It may be out of date.` });
    for (const pr of place.permits_required || []) {
      const permit = data.permitById[pr.permit];
      if (permit && permitApplies(permit, stop.activities)) addPermit(pr.permit, stop, place, pr.when, null);
    }
  }
  if (islands.size > 1) warnings.push({ level: 'info', text: `This trip covers ${islands.size} islands. Some permits are per island.` });

  const list = [...items.values()].map((it) => {
    const booking = it.earliestStart ? bookingStatus(it.permit, it.earliestStart, now) : { state: 'anytime' };
    return { ...it, booking, issuer: data.agencyById[it.permit.issuer] };
  });
  // Prerequisites first, then things whose booking is open or opening soonest, then the rest.
  const rank = (it) => (it.prerequisiteFor.length && !it.stops.length ? 0 : it.booking.state === 'not_yet' ? 2 : 1);
  list.sort((a, b) => rank(a) - rank(b) || (a.booking.opensAt || '').localeCompare(b.booking.opensAt || '') || a.permit.name.localeCompare(b.permit.name));
  return { items: list, warnings, islands: [...islands] };
}

const daysSince = (d) => Math.floor((Date.now() - Date.parse(d)) / 86400000);

/** Reminders a trip could set: booking windows not open yet, and a check-alerts reminder the day before. */
export function remindersForTrip(trip, checklist) {
  const out = [];
  for (const it of checklist.items) {
    if (it.booking.state === 'not_yet') out.push({
      id: `booking:${trip.id}:${it.permit.id}`, type: 'booking_opens', at: it.booking.opensAt, tripId: trip.id,
      title: `Booking opens: ${it.permit.name}`, body: `You can book now for ${trip.name || 'your trip'}.`, route: `#/plan/${trip.id}`,
    });
  }
  const first = (trip.stops || []).map((s) => s.start).filter(Boolean).sort()[0];
  if (first) out.push({
    id: `start:${trip.id}`, type: 'trip_soon', at: hstInstant(addDays(first, -1), '08:00'), tripId: trip.id,
    title: `${trip.name || 'Your trip'} starts tomorrow`, body: 'Check alerts and the weather, and pack your permits.', route: `#/plan/${trip.id}`,
  });
  return out.filter((r) => Date.parse(r.at) > Date.now());
}

/** Encode a trip into a short URL safe string for sharing. */
export function encodeTrip(trip) {
  const compact = { n: trip.name || '', s: (trip.stops || []).map((s) => [s.place, s.activities || [], s.start || '', s.end || '']) };
  const json = JSON.stringify(compact);
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
/** Decode a shared trip string. Returns null if it is not valid. */
export function decodeTrip(str) {
  try {
    const json = decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
    const c = JSON.parse(json);
    if (!Array.isArray(c.s)) return null;
    return { name: String(c.n || '').slice(0, 80), stops: c.s.map(([place, activities, start, end]) => ({ place: String(place), activities: Array.isArray(activities) ? activities.map(String) : [], start: /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : '', end: /^\d{4}-\d{2}-\d{2}$/.test(end) ? end : '' })) };
  } catch { return null; }
}
