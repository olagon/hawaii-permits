import { html, raw } from '../ui.js';
import { loadData, data } from '../data.js';
import { getSettings, setSetting, getSaved, getTrips } from '../store.js';
import { loadAlerts, alertsForIsland } from '../alerts.js';
import { placeCard, alertCard, islandPicker } from '../components.js';
import { buildChecklist } from '../planner.js';

const tile = (href, label, icon) => html`<a class="card big-tile" href="${href}">${raw(icon)}<span>${label}</span></a>`;
const ICONS = {
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zm0 2.2 6 2v9.6l-6-2z" fill="currentColor"/></svg>',
  plan: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm2 5v2h10V8zm0 4v2h10v-2zm0 4v2h7v-2z" fill="currentColor"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6a2 2 0 0 1 2-2h13v3H5v10h14v-3h-6a2 2 0 0 1 0-4h8v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor"/></svg>',
  learn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h5a3 3 0 0 1 1 .2A3 3 0 0 1 13 3h5a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1h-6a1 1 0 0 0-1 1 1 1 0 0 1-2 0 1 1 0 0 0-1-1H5a1 1 0 0 1-1-1zm7 2H6v11h5zm2 0v11h5V7z" fill="currentColor"/></svg>',
};

export default async function () {
  const [d, s, saved, trips] = await Promise.all([loadData(), getSettings(), getSaved(), getTrips()]);
  const island = d.islandById[s.island] ? s.island : 'oahu';
  const savedPlaces = saved.map((id) => d.placeById[id]).filter(Boolean);
  const upcoming = trips.flatMap((t) => buildChecklist(t, d).items.filter((i) => i.booking.state === 'not_yet').map((i) => ({ trip: t, item: i })))
    .sort((a, b) => a.item.booking.opensAt.localeCompare(b.item.booking.opensAt)).slice(0, 5);

  const page = html`
    <h1>Which permits do I need?</h1>
    <p class="muted">Pick an island. Then search a place or open the map.</p>
    <div id="islands"></div>
    <form class="search-box" role="search" id="qs">
      <label for="q" class="sr-only">Search places and permits</label>
      <input id="q" type="search" placeholder="Search a place, trail, park, or permit" autocomplete="off">
    </form>
    <div class="grid" style="margin-top:1rem">
      ${tile('#/map', 'Map', ICONS.map)}${tile('#/plan', 'Plan a trip', ICONS.plan)}${tile('#/wallet', 'Permit wallet', ICONS.wallet)}${tile('#/learn', 'Learn', ICONS.learn)}
    </div>
    <section id="alerts" aria-live="polite"><h2>Alerts for <span id="island-name">${d.islandById[island].name}</span></h2><p class="muted">Loading alerts…</p></section>
    ${upcoming.length ? html`<section><h2>Booking windows opening soon</h2>${upcoming.map(({ trip, item }) => html`<a class="card" href="#/plan/${trip.id}"><strong>${item.permit.name}</strong><div class="small">Opens ${item.booking.opensOn} for ${trip.name || 'your trip'}</div></a>`)}</section>` : ''}
    ${savedPlaces.length ? html`<section><h2>Saved places</h2>${savedPlaces.map(placeCard)}</section>` : ''}
    <section id="popular"><h2>Places on <span class="island-name">${d.islandById[island].name}</span></h2><div id="places"></div></section>
    <p class="muted small">Ala is a free community project, not an official government app. When Ala and an official source disagree, the official source wins.</p>`;

  return {
    title: 'Home', html: page,
    async mount(root) {
      let cur = island;
      const renderPlaces = () => {
        const list = d.places.filter((p) => p.island === cur && p.status === 'open').slice(0, 8);
        root.querySelector('#places').innerHTML = list.map((p) => placeCard(p).s).join('') || '<p class="muted">No places yet for this island.</p>';
        for (const el of root.querySelectorAll('.island-name, #island-name')) el.textContent = d.islandById[cur].name;
      };
      const renderAlerts = async () => {
        const all = await loadAlerts();
        const list = alertsForIsland(all, cur);
        const sec = root.querySelector('#alerts');
        sec.innerHTML = `<h2>Alerts for <span id="island-name">${d.islandById[cur].name}</span></h2>` + (list.length ? list.slice(0, 5).map((a) => alertCard(a).s).join('') + (list.length > 5 ? `<a href="#/alerts">See all ${list.length} alerts</a>` : '') : `<p class="muted">No active alerts.${all.offline ? ' You are offline, so this may be out of date.' : ''}</p>`);
      };
      root.querySelector('#islands').replaceWith(islandPicker(cur, async (id) => { cur = id; await setSetting('island', id); renderPlaces(); renderAlerts(); }));
      renderPlaces(); renderAlerts();
      root.querySelector('#qs').addEventListener('submit', (e) => { e.preventDefault(); location.hash = `#/search?q=${encodeURIComponent(root.querySelector('#q').value)}`; });
      root.querySelector('#q').addEventListener('focus', () => { location.hash = '#/search'; });
    },
  };
}
