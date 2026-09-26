// Check every URL in the data with retries and a polite delay. Writes reports/links.md.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadAll } from './lib.js';

const UA = 'Ala link checker (+https://github.com/olagon/ala)';
const DELAY_MS = 400;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Collect every http(s) URL in an object, with the file it came from. */
function collectUrls(entries) {
  const map = new Map();
  const visit = (v, file) => {
    if (typeof v === 'string' && /^https?:\/\//.test(v)) (map.get(v) || map.set(v, new Set()).get(v)).add(file);
    else if (Array.isArray(v)) v.forEach((x) => visit(x, file));
    else if (v && typeof v === 'object') Object.values(v).forEach((x) => visit(x, file));
  };
  for (const e of entries) visit(e.data, e.file);
  return map;
}

async function check(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA } });
      if (res.status === 405 || res.status === 403 || res.status === 404) res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA } });
      clearTimeout(t);
      if (res.ok) return { ok: true, status: res.status };
      if (res.status >= 500 && i < tries) { await sleep(1500 * i); continue; }
      return { ok: false, status: res.status };
    } catch (e) {
      if (i < tries) { await sleep(1500 * i); continue; }
      return { ok: false, status: e.name === 'AbortError' ? 'timeout' : (e.cause?.code || e.message) };
    }
  }
}

const all = loadAll();
const urls = collectUrls([...all.places, ...all.permits, ...all.agencies]);
const results = [];
let n = 0;
for (const [url, files] of urls) {
  const r = await check(url);
  results.push({ url, files: [...files], ...r });
  n++;
  process.stdout.write(`\r${n}/${urls.size} checked, ${results.filter((x) => !x.ok).length} broken`);
  await sleep(DELAY_MS);
}
console.log();
const broken = results.filter((r) => !r.ok);
const md = [
  `# Link report`, ``, `Checked ${results.length} URLs on ${new Date().toISOString().slice(0, 10)}. ${broken.length} broken.`, ``,
  ...(broken.length ? ['| Status | URL | Used in |', '|---|---|---|', ...broken.map((b) => `| ${b.status} | ${b.url} | ${b.files.join(', ')} |`)] : ['All links OK.']),
  '',
];
mkdirSync(join(ROOT, 'reports'), { recursive: true });
writeFileSync(join(ROOT, 'reports/links.md'), md.join('\n'));
console.log(`reports/links.md written. ${broken.length} broken.`);
