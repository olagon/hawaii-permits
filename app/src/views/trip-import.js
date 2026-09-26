import { html, uid } from '../ui.js';
import { loadData } from '../data.js';
import { saveTrip } from '../store.js';
import { decodeTrip } from '../planner.js';

export default async function ({ query }) {
  const d = await loadData();
  const t = decodeTrip(query.t || '');
  if (!t) return { title: 'Shared trip', html: html`<div class="card"><h1>This trip link is not valid</h1><a class="btn" href="#/plan">Plan a trip</a></div>` };
  const stops = t.stops.filter((s) => d.placeById[s.place]);
  return {
    title: 'Shared trip',
    html: html`<h1>${t.name || 'Shared trip'}</h1>
      <p>Someone shared this trip with you. Save it to see the full permit checklist.</p>
      <ul>${stops.map((s) => html`<li><a href="#/place/${s.place}">${d.placeById[s.place].name}</a>${s.start ? ` · ${s.start}` : ''}</li>`)}</ul>
      <button class="btn" id="save">Save this trip</button>`,
    mount(root) { root.querySelector('#save').addEventListener('click', async () => { const trip = await saveTrip({ id: uid(), name: t.name || 'Shared trip', stops }); location.hash = `#/plan/${trip.id}`; }); },
  };
}
