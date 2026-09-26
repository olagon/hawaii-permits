// Map with MapLibre. Online: OpenFreeMap. Offline: a saved PMTiles island pack.
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PMTiles, Protocol, FileSource } from 'pmtiles';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { get, set, del } from './store.js';
import { isNative, SITE } from './native.js';

export const ONLINE_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const TILES_BASE = (isNative() ? SITE : import.meta.env.BASE_URL) + 'tiles/';
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · <a href="https://openfreemap.org">OpenFreeMap</a> · <a href="https://protomaps.com">Protomaps</a>';

let protocol;
function ensureProtocol() {
  if (protocol) return protocol;
  protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);
  return protocol;
}

/** Is an offline pack saved for this island? */
export const hasPack = async (island) => !!(await get(`tiles:${island}`));
export const packSize = async (island) => (await get(`tiles:${island}`))?.size || 0;

/** Download and save an island pack. Calls onProgress(0..1). */
export async function downloadPack(island, onProgress = () => {}) {
  const res = await fetch(`${TILES_BASE}${island}.pmtiles`);
  if (!res.ok) throw new Error(`No offline pack for ${island} yet (${res.status})`);
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); got += value.length;
    if (total) onProgress(got / total);
  }
  const blob = new Blob(chunks, { type: 'application/octet-stream' });
  await set(`tiles:${island}`, blob);
  return blob.size;
}
export const removePack = (island) => del(`tiles:${island}`);

/** A MapLibre style that reads the saved pack for this island. */
async function offlineStyle(island) {
  const blob = await get(`tiles:${island}`);
  const p = new PMTiles(new FileSource(new File([blob], `${island}.pmtiles`)));
  ensureProtocol().add(p);
  const dark = matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme !== 'light' || document.documentElement.dataset.theme === 'dark';
  return {
    version: 8,
    glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
    sprite: `https://protomaps.github.io/basemaps-assets/sprites/v4/${dark ? 'dark' : 'light'}`,
    sources: { protomaps: { type: 'vector', url: `pmtiles://${p.source.getKey()}`, attribution: ATTRIBUTION } },
    layers: layers('protomaps', namedFlavor(dark ? 'dark' : 'light'), { lang: 'en' }),
  };
}

/**
 * Create the map. Uses the offline pack when offline (or forced) and one is saved.
 * @returns {Promise<{map: maplibregl.Map, offline: boolean}>}
 */
export async function createMap(container, island, { center, zoom, offline = !navigator.onLine } = {}) {
  let style = ONLINE_STYLE;
  let usingOffline = false;
  if (offline && (await hasPack(island))) { style = await offlineStyle(island); usingOffline = true; }
  const map = new maplibregl.Map({ container, style, center: [center.lng, center.lat], zoom, attributionControl: false });
  map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: usingOffline ? '' : 'OpenFreeMap · Protomaps' }));
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  if (!usingOffline && (await hasPack(island))) {
    // If online tiles fail to load (for example the network drops), fall back to the pack.
    map.once('error', async () => { if (!navigator.onLine) map.setStyle(await offlineStyle(island)); });
  }
  return { map, offline: usingOffline };
}

/** Add an HTML marker for a place. Shape and letter come from land type; warning shape for closed places. */
export function placeMarker(map, place, onClick) {
  const el = document.createElement('button');
  const closed = ['closed', 'removed', 'no_public_access'].includes(place.status);
  el.className = `marker ${closed ? 'warn' : place.land_type}`;
  el.type = 'button';
  el.setAttribute('aria-label', `${place.name}, ${place.status.replace(/_/g, ' ')}`);
  el.innerHTML = `<span>${closed ? '!' : place.land_type[0].toUpperCase()}</span>`;
  el.addEventListener('click', (e) => { e.stopPropagation(); onClick(place); });
  return new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([place.location.lng, place.location.lat]).addTo(map);
}

export function userMarker(map, { lat, lng }) {
  const el = document.createElement('div');
  el.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#1a5f8f;border:3px solid #fff;box-shadow:0 0 0 2px #1a5f8f';
  el.setAttribute('aria-label', 'Your location');
  return new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
}
export { maplibregl };
