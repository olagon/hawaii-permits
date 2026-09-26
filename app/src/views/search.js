import { html, statusBadge, landWord } from '../ui.js';
import { loadData, data } from '../data.js';
import { search } from '../search.js';

export default async function ({ query }) {
  await loadData();
  const q = query.q || '';
  return {
    title: 'Search',
    html: html`<h1>Search</h1>
      <form role="search" id="f"><label for="q" class="sr-only">Search places and permits</label>
      <input id="q" type="search" value="${q}" placeholder="Try kaena, Kōkeʻe, camping, hunting license" autocomplete="off" autofocus></form>
      <p class="muted small">Works with or without ʻokina and kahakō.</p>
      <div class="results" id="r" aria-live="polite"></div>`,
    mount(root) {
      const d = data();
      const input = root.querySelector('#q');
      const out = root.querySelector('#r');
      const run = async () => {
        const v = input.value;
        history.replaceState(null, '', `#/search?q=${encodeURIComponent(v)}`);
        if (!v.trim()) { out.innerHTML = ''; return; }
        const res = await search(v);
        out.innerHTML = res.length ? `<ul class="list">${res.map((r) => {
          if (r.kind === 'place') { const p = d.placeById[r.id]; return html`<li><a href="#/place/${p.id}"><div class="kind">${d.islandById[p.island]?.name} · ${landWord(p.land_type)}</div><div class="t">${p.name}</div>${statusBadge(p.status)}</a></li>`.s; }
          if (r.kind === 'permit') return html`<li><a href="#/permit/${r.id}"><div class="kind">Permit</div><div class="t">${r.name}</div></a></li>`.s;
          const a = d.agencyById[r.id];
          return html`<li><a href="${a.website}" target="_blank" rel="noopener"><div class="kind">Agency</div><div class="t">${a.name} ↗</div></a></li>`.s;
        }).join('')}</ul>` : '<p class="muted">Nothing found. Try a shorter word.</p>';
      };
      let t; input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 120); });
      root.querySelector('#f').addEventListener('submit', (e) => { e.preventDefault(); run(); });
      if (q) run();
      input.focus();
    },
  };
}
