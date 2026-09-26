import { html, raw, fmtDate } from '../ui.js';
import { loadData } from '../data.js';
import { getSettings, setSetting, getSaved, getTrips } from '../store.js';
import { loadAlerts, alertsForIsland } from '../alerts.js';
import { placeList, alertCard, islandPicker, ICONS } from '../components.js';
import { buildChecklist } from '../planner.js';

const action = (href, label, hint, icon) => html`<a class="card action" href="${href}"><span class="ic">${raw(icon)}</span><span><b>${label}</b><small>${hint}</small></span></a>`;

export default async function () {
  const [d, s, saved, trips] = await Promise.all([loadData(), getSettings(), getSaved(), getTrips()]);
  const island = d.islandById[s.island] ? s.island : 'oahu';
  const savedPlaces = saved.map((id) => d.placeById[id]).filter(Boolean);
  const upcoming = trips.flatMap((t) => buildChecklist(t, d).items.filter((i) => i.booking.state === 'not_yet').map((i) => ({ trip: t, item: i })))
    .sort((a, b) => a.item.booking.opensAt.localeCompare(b.item.booking.opensAt)).slice(0, 5);

  const page = html`
    <div class="hero">
      <h1>Which permits do I need?</h1>
      <p>Hikes, camps, hunts, fishing, and parks across Hawaiʻi, with the permit each one needs.</p>
      <form class="searchbar" role="search" id="qs">${raw(ICONS.search)}<label for="q" class="sr-only">Search places and permits</label><input id="q" type="search" placeholder="Search a place, trail, park, or permit" autocomplete="off"></form>
    </div>
    <div id="islands" class="island-picker"></div>
    <div class="actions">
      ${action('#/map', 'Map', 'Every place by island', ICONS.map)}${action('#/plan', 'Plan a trip', 'One checklist, with reminders', ICONS.plan)}${action('#/wallet', 'Wallet', 'Show a ranger, offline', ICONS.wallet)}${action('#/learn', 'Learn', 'Safety, culture, rules', ICONS.learn)}
    </div>
    ${upcoming.length ? html`<div class="section-head"><h2>Booking windows opening soon</h2></div>${upcoming.map(({ trip, item }) => html`<a class="card" href="#/plan/${trip.id}"><strong>${item.permit.name}</strong><div class="muted">Opens ${fmtDate(item.booking.opensOn)} for ${trip.name || 'your trip'}</div></a>`)}` : ''}
    <section id="alerts" aria-live="polite"><div class="section-head"><h2>Alerts for <span class="island-name">${d.islandById[island].name}</span></h2><a href="#/alerts">All alerts</a></div><p class="muted">Loading alerts…</p></section>
    ${savedPlaces.length ? html`<div class="section-head"><h2>Saved places</h2></div>${placeList(savedPlaces)}` : ''}
    <section id="popular"><div class="section-head"><h2>Places on <span class="island-name">${d.islandById[island].name}</span></h2><a href="#/map">Map</a></div><div id="places"></div></section>
    <p class="muted" style="margin-top:1.5rem">Hawaiʻi Permits is a free community project, not an official government app. When it disagrees with an official source, the official source wins.</p>`;

  return {
    title: 'Home', html: page,
    async mount(root) {
      let cur = island;
      const renderPlaces = () => {
        const list = d.places.filter((p) => p.island === cur && p.status === 'open').slice(0, 10);
        root.querySelector('#places').innerHTML = list.length ? placeList(list).s : '<p class="muted">No places yet for this island.</p>';
        for (const el of root.querySelectorAll('.island-name')) el.textContent = d.islandById[cur].name;
      };
      const renderAlerts = async () => {
        const all = await loadAlerts();
        const list = alertsForIsland(all, cur);
        const sec = root.querySelector('#alerts');
        sec.querySelectorAll(':scope > :not(.section-head)').forEach((n) => n.remove());
        sec.insertAdjacentHTML('beforeend', list.length ? list.slice(0, 4).map((a) => alertCard(a).s).join('') + (list.length > 4 ? `<p class="small"><a href="#/alerts">See all ${list.length} alerts</a></p>` : '') : `<p class="muted">No active alerts.${all.offline ? ' You are offline, so this may be out of date.' : ''}</p>`);
      };
      root.querySelector('#islands').replaceWith(islandPicker(cur, async (id) => { cur = id; await setSetting('island', id); renderPlaces(); renderAlerts(); }));
      renderPlaces(); renderAlerts();
      root.querySelector('#qs').addEventListener('submit', (e) => { e.preventDefault(); location.hash = `#/search?q=${encodeURIComponent(root.querySelector('#q').value)}`; });
      root.querySelector('#q').addEventListener('focus', () => { location.hash = '#/search'; });
    },
  };
}
