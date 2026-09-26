// List every entry not verified in 90 days. Writes reports/stale.md.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadAll, daysSince, STALE_DAYS } from './lib.js';

const all = loadAll();
const rows = [...all.places, ...all.permits]
  .map((e) => ({ file: e.file, name: e.data.name, date: e.data.last_verified, days: daysSince(e.data.last_verified) }))
  .filter((r) => r.days > STALE_DAYS)
  .sort((a, b) => b.days - a.days);
const md = [
  `# Stale data report`, ``, `${rows.length} entries not verified in ${STALE_DAYS} days as of ${new Date().toISOString().slice(0, 10)}.`, ``,
  ...(rows.length ? ['| Days | Last verified | Name | File |', '|---|---|---|---|', ...rows.map((r) => `| ${r.days} | ${r.date} | ${r.name} | ${r.file} |`)] : ['Nothing is stale.']),
  '',
];
mkdirSync(join(ROOT, 'reports'), { recursive: true });
writeFileSync(join(ROOT, 'reports/stale.md'), md.join('\n'));
console.log(`reports/stale.md written. ${rows.length} stale.`);
