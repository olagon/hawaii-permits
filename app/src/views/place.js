import { html, statusBadge, statusWord, landWord, hazardWord, money, fmtDate, toast } from '../ui.js';
import { loadData, data, managerName } from '../data.js';
import { getSaved, toggleSaved, getTrips, saveTrip } from '../store.js';
import { loadAlerts, alertsForPlace } from '../alerts.js';
import { permitSummary, staleNote, sourcesList, alertCard, suggestEditUrl } from '../components.js';
import { share, copy, SITE } from '../native.js';
import { uid } from '../ui.js';

export default async function ({ params }) {
  const d = await loadData();
  const p = d.placeById[params.id];
  if (!p) return { title: 'Not found', html: html`<div class="card"><h1>Place not found</h1><a class="btn" href="#/">Go home</a></div>` };
  const closed = ['closed', 'removed', 'no_public_access'].includes(p.status);
  const bannerText = {
    closed: 'This place is closed. Do not go. Check the official source for updates.',
    removed: 'This place has been removed or made inaccessible. There is no legal way in. Please do not go.',
    no_public_access: 'No public access. Entering is trespassing. Please do not go.',
    restricted: 'Access is restricted. Read the rules below before going.',
    seasonal: 'Open only part of the year. Check the dates below.',
  }[p.status];
  const saved = (await getSaved()).includes(p.id);
  const fees = p.fees ? Object.entries(p.fees).filter(([k]) => k !== 'note') : [];

  const page = html`
    <div class="row" style="justify-content:space-between;align-items:flex-start"><h1>${p.name}</h1>${statusBadge(p.status)}</div>
    <p class="muted">${d.islandById[p.island]?.name} · ${landWord(p.land_type)} land · Managed by ${managerName(p)}${p.moku ? ` · ${p.moku}` : ''}${p.ahupuaa ? `, ${p.ahupuaa}` : ''}</p>
    ${bannerText ? html`<div class="status-banner ${closed ? 'danger' : 'warn'}">${bannerText}</div>` : ''}
    ${p.summary ? html`<p>${p.summary}</p>` : ''}
    <div class="row">
      <button class="btn secondary small" id="save" aria-pressed="${saved}">${saved ? 'Saved' : 'Save'}</button>
      <button class="btn secondary small" id="share">Share</button>
      <button class="btn secondary small" id="trip">Add to trip</button>
      <a class="btn secondary small" href="${suggestEditUrl(p)}" target="_blank" rel="noopener">Suggest an edit</a>
    </div>
    <div id="alerts"></div>
    ${staleNote(p.last_verified)}
    <h2>What you need</h2>
    ${p.permits_required.length ? p.permits_required.map((pr) => permitSummary(d.permitById[pr.permit], pr.when)) : html`<div class="card"><p>${closed ? 'No permits are issued because this place is not open to the public.' : 'No permit or reservation is listed for this place. Normal park rules still apply.'}</p></div>`}
    ${p.booking?.url || p.booking?.phone || p.booking?.window_note ? html`<div class="card"><h3>Booking</h3>${p.booking.window_note ? html`<p>${p.booking.window_note}</p>` : ''}${p.booking.phone ? html`<p>Phone: ${p.booking.phone}</p>` : ''}${p.booking.url ? html`<a class="btn small" href="${p.booking.url}" target="_blank" rel="noopener">Book on the official site ↗</a>` : ''}</div>` : ''}
    ${fees.length ? html`<h2>Fees</h2><div class="card"><table>${fees.map(([k, v]) => html`<tr><th>${k.replace(/_/g, ' ')}</th><td>${money(v)}</td></tr>`)}</table>${p.fees.note ? html`<p class="small muted">${p.fees.note}</p>` : ''}</div>` : ''}
    ${p.activities.length ? html`<h2>Activities</h2><div class="chips">${p.activities.map((a) => html`<span class="chip">${d.activityById[a]?.name || a}</span>`)}</div>` : ''}
    ${p.hazards?.length ? html`<h2>Hazards</h2><div class="row">${p.hazards.map((h) => html`<span class="hazard">⚠ ${hazardWord(h)}</span>`)}</div>` : ''}
    ${p.rules?.length ? html`<h2>Rules</h2><ul>${p.rules.map((r) => html`<li>${r}</li>`)}</ul>` : ''}
    ${p.max_stay_nights || p.group_size_limit ? html`<p class="small">${p.max_stay_nights ? `Max stay ${p.max_stay_nights} nights. ` : ''}${p.group_size_limit ? `Group size up to ${p.group_size_limit}.` : ''}</p>` : ''}
    ${p.amenities?.length ? html`<h2>Amenities</h2><p>${p.amenities.join(', ')}</p>` : ''}
    ${p.accessibility ? html`<h2>Accessibility</h2><p>${p.accessibility}</p>` : ''}
    ${p.cultural_notes ? html`<h2>Cultural notes</h2><p>${p.cultural_notes}</p>` : ''}
    ${!closed ? html`<p><a class="btn secondary small" href="#/map?focus=${p.id}">Show on map</a> <a class="small" href="https://www.google.com/maps/dir/?api=1&destination=${p.location.lat},${p.location.lng}" target="_blank" rel="noopener">Directions ↗</a></p>` : ''}
    ${sourcesList(p.sources, p.last_verified)}
    ${p.owner_claimed ? html`<p class="muted small">This listing was confirmed by the owner.</p>` : ''}`;

  return {
    title: p.name, html: page,
    async mount(root) {
      root.querySelector('#save').addEventListener('click', async (e) => { const on = await toggleSaved(p.id); e.target.textContent = on ? 'Saved' : 'Save'; e.target.setAttribute('aria-pressed', on); });
      root.querySelector('#share').addEventListener('click', async () => {
        const url = `${SITE}#/place/${p.id}`;
        const ok = await share({ title: p.name, text: `${p.name}: what permits you need, on Ala.`, url });
        if (!ok) toast((await copy(url)) ? 'Link copied' : url);
      });
      root.querySelector('#trip').addEventListener('click', async () => {
        const trips = await getTrips();
        let trip = trips.find((t) => !t.stops.some((s) => s.place === p.id)) || null;
        if (!trip || trips.length === 0) trip = trips[0] || { id: uid(), name: 'My trip', stops: [] };
        if (!trip.stops.some((s) => s.place === p.id)) trip.stops.push({ place: p.id, activities: [], start: '', end: '' });
        await saveTrip(trip);
        toast(`Added to ${trip.name}`);
        location.hash = `#/plan/${trip.id}`;
      });
      const all = await loadAlerts();
      const list = alertsForPlace(all, p);
      if (list.length) root.querySelector('#alerts').innerHTML = `<h2>Alerts</h2>${list.slice(0, 3).map((a) => alertCard(a).s).join('')}`;
    },
  };
}
