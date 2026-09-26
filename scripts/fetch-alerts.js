// Fetch active alerts from NWS (always), NPS and RIDB (when keys exist), and DLNR news (RSS).
// Writes app/public/data/alerts.json. A failed source never breaks the file: the last good
// alerts for that source are kept.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { load as yamlLoad } from 'js-yaml';
import { DATA, OUT, loadAll } from './lib.js';

const UA = 'Ala alerts (+https://github.com/olagon/ala)';
const LIVE = 'https://olagon.github.io/ala/data/alerts.json';
const outFile = join(OUT, 'alerts.json');
const sources = yamlLoad(readFileSync(join(DATA, 'alert-sources.yaml'), 'utf8'));
const places = loadAll().places.map((p) => p.data);

const ISLAND_WORDS = [
  ['niihau', /niihau/i], ['kauai', /kauai/i], ['oahu', /oahu|waianae|koolau|olomana|honolulu/i],
  ['molokai', /molokai/i], ['lanai', /lanai/i], ['kahoolawe', /kahoolawe/i],
  ['maui', /maui|haleakala|kula|kipahulu|hana\b/i], ['hawaii', /big island|kona|kohala|hilo|puna|kau\b|hamakua|mauna/i],
];
const islandsOf = (text) => ISLAND_WORDS.filter(([, re]) => re.test(text)).map(([id]) => id);

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** Load the previous alerts file so a failed source keeps its last good data. */
async function previous() {
  try { if (existsSync(outFile)) return JSON.parse(readFileSync(outFile, 'utf8')); } catch {}
  try { return await getJson(LIVE); } catch { return { alerts: [] }; }
}

async function nws() {
  const zones = await getJson('https://api.weather.gov/zones?area=HI&type=forecast,county,fire');
  const zoneIsland = {};
  for (const z of zones.features) zoneIsland[z.properties.id] = islandsOf(z.properties.name);
  const data = await getJson(sources.find((s) => s.id === 'nws').url);
  return data.features.map((f) => {
    const p = f.properties;
    const ugc = p.geocode?.UGC || [];
    const islands = [...new Set([...ugc.flatMap((z) => zoneIsland[z] || []), ...islandsOf(p.areaDesc || '')])];
    return {
      id: p.id, source: 'nws', event: p.event, headline: p.headline, description: (p.description || '').slice(0, 2000),
      severity: p.severity, urgency: p.urgency, area: p.areaDesc, zones: ugc, islands,
      places: places.filter((pl) => pl.alerts?.nws_zone && ugc.includes(pl.alerts.nws_zone)).map((pl) => pl.id),
      onset: p.onset, ends: p.ends || p.expires, url: `https://alerts.weather.gov/search?id=${encodeURIComponent(p.id)}`,
    };
  });
}

async function nps() {
  const src = sources.find((s) => s.id === 'nps');
  const key = process.env[src.key_env];
  if (!key) { console.log('NPS_API_KEY not set, skipping NPS alerts'); return null; }
  const data = await getJson(`${src.url}?parkCode=${src.park_codes.join(',')}&limit=200`, { 'X-Api-Key': key });
  return data.data.map((a) => ({
    id: `nps:${a.id}`, source: 'nps', event: a.category, headline: a.title, description: (a.description || '').slice(0, 2000),
    severity: /closure|danger/i.test(a.category) ? 'Severe' : 'Moderate', urgency: 'Unknown', area: a.parkCode, zones: [], islands: [],
    places: places.filter((pl) => pl.alerts?.nps_park_code === a.parkCode).map((pl) => pl.id),
    onset: a.lastIndexedDate || null, ends: null, url: a.url || 'https://www.nps.gov/',
  })).map((a) => ({ ...a, islands: [...new Set(a.places.map((id) => places.find((p) => p.id === id).island))] }));
}

async function ridb() {
  const src = sources.find((s) => s.id === 'ridb');
  const key = process.env[src.key_env];
  if (!key) { console.log('RIDB_API_KEY not set, skipping RIDB refresh'); return null; }
  // RIDB has no alerts endpoint. We refresh federal facility reservation flags into a small side file.
  const data = await getJson(`${src.url}/facilities?state=HI&activity=CAMPING&limit=50`, { apikey: key });
  writeFileSync(join(OUT, 'ridb-facilities.json'), JSON.stringify(data.RECDATA.map((f) => ({
    id: f.FacilityID, name: f.FacilityName, reservable: f.Reservable, url: `https://www.recreation.gov/camping/campgrounds/${f.FacilityID}`,
  }))));
  return [];
}

async function dlnrNews() {
  const src = sources.find((s) => s.id === 'dlnr_news');
  const res = await fetch(src.url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${src.url}`);
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  const tag = (s, t) => (s.match(new RegExp(`<${t}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${t}>`)) || [])[1]?.trim() || '';
  return items
    .map((i) => ({ title: tag(i, 'title'), link: tag(i, 'link'), date: tag(i, 'pubDate') }))
    .filter((i) => /clos|reopen|warning|hazard|advisory|restrict|danger|rockfall|flood|fire/i.test(i.title))
    .slice(0, 15)
    .map((i) => ({
      id: `dlnr:${i.link}`, source: 'dlnr_news', event: 'DLNR news', headline: i.title, description: '', severity: 'Unknown', urgency: 'Unknown',
      area: 'DLNR', zones: [], islands: islandsOf(i.title), places: [], onset: i.date ? new Date(i.date).toISOString() : null, ends: null, url: i.link,
    }));
}

const prev = await previous();
const out = [];
const status = {};
for (const [name, fn] of [['nws', nws], ['nps', nps], ['ridb', ridb], ['dlnr_news', dlnrNews]]) {
  try {
    const r = await fn();
    if (r === null) { status[name] = 'skipped'; continue; }
    out.push(...r);
    status[name] = `ok (${r.length})`;
  } catch (e) {
    const kept = (prev.alerts || []).filter((a) => a.source === name);
    out.push(...kept);
    status[name] = `failed, kept ${kept.length} previous: ${e.message}`;
  }
}
mkdirSync(OUT, { recursive: true });
writeFileSync(outFile, JSON.stringify({ updated: new Date().toISOString(), status, alerts: out }));
console.log(status, `${out.length} alerts written`);
