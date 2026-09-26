// Bundle YAML data into JSON files the app loads, plus a prebuilt search index.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import MiniSearch from 'minisearch';
import { ROOT, OUT, loadAll } from './lib.js';
import { searchOptions } from '../app/src/search-options.js';

const all = loadAll();
const places = all.places.map((p) => p.data);
const permits = all.permits.map((p) => p.data);
const agencies = all.agencies.map((a) => a.data);

mkdirSync(OUT, { recursive: true });
const write = (name, obj) => writeFileSync(join(OUT, name), JSON.stringify(obj));

write('places.json', places);
write('permits.json', permits);
write('agencies.json', agencies);
write('islands.json', all.islands);
write('activities.json', all.activities);
for (const island of all.islands) write(`places-${island.id}.json`, places.filter((p) => p.island === island.id));

const search = new MiniSearch(searchOptions);
search.addAll([
  ...places.map((p) => ({ id: `place:${p.id}`, kind: 'place', name: p.name, aliases: (p.aliases || []).join(' '), island: p.island, extra: p.summary || '' })),
  ...permits.map((p) => ({ id: `permit:${p.id}`, kind: 'permit', name: p.name, aliases: '', island: '', extra: p.who_needs })),
  ...agencies.map((a) => ({ id: `agency:${a.id}`, kind: 'agency', name: a.name, aliases: '', island: '', extra: '' })),
]);
writeFileSync(join(OUT, 'search-index.json'), JSON.stringify(search));

const version = createHash('sha256').update(JSON.stringify([places, permits, agencies])).digest('hex').slice(0, 12);
const alertsFile = join(OUT, 'alerts.json');
if (!existsSync(alertsFile)) write('alerts.json', { updated: null, alerts: [] });
write('manifest.json', {
  version,
  date: new Date().toISOString(),
  files: ['places.json', 'permits.json', 'agencies.json', 'islands.json', 'activities.json', 'search-index.json'],
  counts: { places: places.length, permits: permits.length, agencies: agencies.length },
});
console.log(`bundle ${version}: ${places.length} places, ${permits.length} permits, ${agencies.length} agencies`);
