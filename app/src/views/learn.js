import { html, raw } from '../ui.js';
import { PAGES } from '../learn-content.js';

export default async function ({ params }) {
  if (params.slug) {
    const p = PAGES.find((x) => x.slug === params.slug);
    if (!p) return { title: 'Not found', html: html`<div class="card"><h1>Page not found</h1><a class="btn" href="#/learn">Learn</a></div>` };
    return { title: p.title, html: html`<a class="small" href="#/learn">← Learn</a><h1>${p.title}</h1><div class="learn-body">${raw(p.body)}</div><h2>Sources</h2><ul class="small">${p.sources.map((s) => html`<li><a href="${s}" target="_blank" rel="noopener">${s.replace(/^https?:\/\//, '')}</a></li>`)}</ul>` };
  }
  return { title: 'Learn', html: html`<h1>Learn</h1><p>Short pages on going outdoors the right way in Hawaiʻi.</p><ul class="list">${PAGES.map((p) => html`<li><a href="#/learn/${p.slug}"><div class="t">${p.title}</div><div class="muted small">${p.blurb}</div></a></li>`)}</ul>` };
}
