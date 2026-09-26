// Live alerts from alerts.json on the site. Network first, then whatever was stored last.
import { get, set } from './store.js';
import { isNative, SITE } from './native.js';

const URL_ = (isNative() ? SITE : import.meta.env.BASE_URL) + 'data/alerts.json';
let cache = null;

export async function loadAlerts() {
  if (cache) return cache;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(URL_, { cache: 'no-cache', signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(res.status);
    cache = await res.json();
    set('alerts', cache).catch(() => {});
  } catch {
    cache = (await get('alerts').catch(() => null)) || { updated: null, alerts: [], offline: true };
    cache.offline = true;
  }
  cache.alerts = (cache.alerts || []).filter((a) => !a.ends || Date.parse(a.ends) > Date.now() - 3600000);
  return cache;
}

export const alertsForIsland = (all, island) => all.alerts.filter((a) => a.islands.includes(island));
/** Alerts for a place: zone or park matches first, then island wide ones. */
export const alertsForPlace = (all, place) => all.alerts.filter((a) => a.places.includes(place.id) || (a.islands.includes(place.island) && a.source !== 'nps'));
export const isSevere = (a) => /extreme|severe/i.test(a.severity) || /warning|closure/i.test(a.event);
