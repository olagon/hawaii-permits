// Loads the data bundle. Order: fresh copy from the site if the manifest version changed,
// then the copy stored in IndexedDB, then the copy shipped inside the app build.
import { get, set } from './store.js';
import { isNative, SITE } from './native.js';

const LOCAL = import.meta.env.BASE_URL + 'data/';
const REMOTE = isNative() ? SITE + 'data/' : LOCAL;
const FILES = ['places', 'permits', 'agencies', 'islands', 'activities', 'search-index'];
let bundle = null;
let loading = null;

async function fetchJson(base, name, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 8000);
  try {
    const res = await fetch(`${base}${name}.json`, { cache: opts.cache || 'default', signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${name}`);
    return await res.json();
  } finally { clearTimeout(t); }
}

async function download(base, manifest) {
  const entries = await Promise.all(FILES.map(async (f) => [f, await fetchJson(base, f)]));
  return index({ manifest, ...Object.fromEntries(entries), storedAt: new Date().toISOString() });
}

function index(b) {
  b.placeById = Object.fromEntries(b.places.map((p) => [p.id, p]));
  b.permitById = Object.fromEntries(b.permits.map((p) => [p.id, p]));
  b.agencyById = Object.fromEntries(b.agencies.map((a) => [a.id, a]));
  b.islandById = Object.fromEntries(b.islands.map((i) => [i.id, i]));
  b.activityById = Object.fromEntries(b.activities.map((a) => [a.id, a]));
  return b;
}

/** Load the data once. Later calls return the same object. */
export function loadData() {
  if (bundle) return Promise.resolve(bundle);
  if (loading) return loading;
  loading = (async () => {
    const stored = await get('data:bundle').catch(() => null);
    let manifest = null;
    try { manifest = await fetchJson(REMOTE, 'manifest', { cache: 'no-cache', timeout: 6000 }); } catch {}
    if (manifest && stored?.manifest?.version !== manifest.version) {
      try { bundle = await download(REMOTE, manifest); await set('data:bundle', strip(bundle)); return bundle; } catch (e) { console.warn('data update failed', e); }
    }
    if (stored) return (bundle = index(stored));
    const local = await fetchJson(LOCAL, 'manifest');
    bundle = await download(LOCAL, local);
    set('data:bundle', strip(bundle)).catch(() => {});
    return bundle;
  })();
  return loading;
}
const strip = ({ placeById, permitById, agencyById, islandById, activityById, ...rest }) => rest;

/** The loaded bundle. Only valid after loadData() resolved. */
export const data = () => bundle;

/** Manager display name for a place: agency name if the manager is an agency id. */
export const managerName = (place) => bundle?.agencyById[place.manager]?.name || place.manager;

/** Force a fresh download, used by the Settings "refresh data" button. */
export async function refreshData() {
  const manifest = await fetchJson(REMOTE, 'manifest', { cache: 'no-cache' });
  bundle = await download(REMOTE, manifest);
  await set('data:bundle', strip(bundle));
  return bundle;
}
