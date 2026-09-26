// Check every URL in the data with retries and a polite per host delay. Writes reports/links.md.
// 429 (rate limited) and 403 (bot blocked) are reported as "unverified", not broken, since the
// page usually works in a browser.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadAll } from './lib.js';

const UA = 'Mozilla/5.0 (compatible; Ala link checker; +https://github.com/olagon/ala)';
const HOST_DELAY_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lastHit = new Map();

/** Collect every http(s) URL in an object, with the files it came from. */
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

async function politeFetch(url, method) {
  const host = new URL(url).host;
  const wait = HOST_DELAY_MS - (Date.now() - (lastHit.get(host) || 0));
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try { return await fetch(url, { method, redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,*/*' } }); }
  finally { clearTimeout(t); }
}

async function check(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      let res = await politeFetch(url, 'HEAD');
      if ([405, 403, 404, 501].includes(res.status)) res = await politeFetch(url, 'GET');
      if (res.ok) return { state: 'ok', status: res.status };
      if (res.status === 429) { if (i < tries) { await sleep(Number(res.headers.get('retry-after')) * 1000 || 8000 * i); continue; } return { state: 'unverified', status: 429 }; }
      if (res.status === 403) return { state: 'unverified', status: 403 };
      if (res.status >= 500 && i < tries) { await sleep(2000 * i); continue; }
      return { state: 'broken', status: res.status };
    } catch (e) {
      if (i < tries) { await sleep(2000 * i); continue; }
      return { state: 'broken', status: e.name === 'AbortError' ? 'timeout' : (e.cause?.code || e.message) };
    }
  }
}

const all = loadAll();
const urls = collectUrls([...all.places, ...all.permits, ...all.agencies]);
const results = [];
let n = 0;
// Interleave hosts so the per host delay does not serialize everything.
const queue = [...urls.entries()].sort((a, b) => a[0].split('/')[2].localeCompare(b[0].split('/')[2]) || 0);
const byHost = new Map();
for (const e of queue) { const h = e[0].split('/')[2]; (byHost.get(h) || byHost.set(h, []).get(h)).push(e); }
const order = [];
while (byHost.size) for (const [h, list] of [...byHost]) { order.push(list.shift()); if (!list.length) byHost.delete(h); }
await Promise.all(Array.from({ length: 4 }, async () => {
  for (;;) {
    const item = order.shift();
    if (!item) return;
    const [url, files] = item;
    results.push({ url, files: [...files], ...(await check(url)) });
    if (process.stdout.isTTY) process.stdout.write(`\r${++n}/${urls.size}`);
  }
}));
if (process.stdout.isTTY) console.log();
const broken = results.filter((r) => r.state === 'broken');
const unverified = results.filter((r) => r.state === 'unverified');
const table = (rows) => ['| Status | URL | Used in |', '|---|---|---|', ...rows.map((b) => `| ${b.status} | ${b.url} | ${b.files.join(', ')} |`)];
const md = [
  `# Link report`, ``, `Checked ${results.length} URLs on ${new Date().toISOString().slice(0, 10)}. ${broken.length} broken, ${unverified.length} unverified (rate limited or bot blocked, usually fine in a browser).`, ``,
  `## Broken`, ``, ...(broken.length ? table(broken) : ['None.']), ``,
  `## Unverified`, ``, ...(unverified.length ? table(unverified) : ['None.']), '',
];
mkdirSync(join(ROOT, 'reports'), { recursive: true });
writeFileSync(join(ROOT, 'reports/links.md'), md.join('\n'));
console.log(`reports/links.md written. ${broken.length} broken, ${unverified.length} unverified.`);
