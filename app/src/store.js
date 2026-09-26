// Everything the user saves lives on the device in IndexedDB. Nothing is uploaded anywhere.
import { get, set, del, keys } from 'idb-keyval';

const DEFAULTS = { island: 'oahu', theme: 'system', notifications: false, offlineMaps: [] };
let settingsCache;

export async function getSettings() {
  if (!settingsCache) settingsCache = { ...DEFAULTS, ...((await get('settings')) || {}) };
  return settingsCache;
}
export async function setSetting(key, value) {
  const s = await getSettings();
  s[key] = value;
  await set('settings', s);
  return s;
}
export const getTrips = async () => (await get('trips')) || [];
export async function saveTrip(trip) {
  const trips = await getTrips();
  const i = trips.findIndex((t) => t.id === trip.id);
  trip.updated = new Date().toISOString();
  if (i >= 0) trips[i] = trip; else trips.push(trip);
  await set('trips', trips);
  return trip;
}
export async function deleteTrip(id) { await set('trips', (await getTrips()).filter((t) => t.id !== id)); }
export const getSaved = async () => (await get('saved')) || [];
export async function toggleSaved(placeId) {
  const saved = await getSaved();
  const next = saved.includes(placeId) ? saved.filter((x) => x !== placeId) : [...saved, placeId];
  await set('saved', next);
  return next.includes(placeId);
}
export const getChecks = async (tripId) => (await get(`checks:${tripId}`)) || {};
export const setChecks = (tripId, v) => set(`checks:${tripId}`, v);
export { get, set, del, keys };

/** Wipe everything the app stored on this device. */
export async function clearAll() {
  for (const k of await keys()) await del(k);
  settingsCache = null;
  try { localStorage.clear(); } catch {}
  if ('caches' in window) for (const n of await caches.keys()) await caches.delete(n);
}
