// Instant search over places, permits, and agencies with a prebuilt MiniSearch index.
import MiniSearch from 'minisearch';
import { searchOptions, normalize } from './search-options.js';
import { loadData } from './data.js';

let ms = null;

async function ready() {
  if (ms) return ms;
  const d = await loadData();
  try { ms = MiniSearch.loadJS(d['search-index'], searchOptions); }
  catch {
    ms = new MiniSearch(searchOptions);
    ms.addAll([
      ...d.places.map((p) => ({ id: `place:${p.id}`, kind: 'place', name: p.name, aliases: (p.aliases || []).join(' '), island: p.island, extra: p.summary || '' })),
      ...d.permits.map((p) => ({ id: `permit:${p.id}`, kind: 'permit', name: p.name, aliases: '', island: '', extra: p.who_needs })),
      ...d.agencies.map((a) => ({ id: `agency:${a.id}`, kind: 'agency', name: a.name, aliases: '', island: '', extra: '' })),
    ]);
  }
  return ms;
}

/**
 * Search. Works with or without ʻokina and kahakō.
 * @returns {Promise<Array<{kind:string, id:string, name:string, island?:string, score:number}>>}
 */
export async function search(query, { island, limit = 20 } = {}) {
  const q = normalize(query).trim();
  if (!q) return [];
  const idx = await ready();
  return idx.search(q)
    .filter((r) => !island || r.kind !== 'place' || r.island === island)
    .slice(0, limit)
    .map((r) => ({ kind: r.kind, id: r.id.split(':')[1], name: r.name, island: r.island, score: r.score }));
}
export { normalize };
