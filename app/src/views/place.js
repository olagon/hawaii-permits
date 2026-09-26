import { html, raw, statusBadge, landWord, hazardWord, money, toast, uid } from '../ui.js';
import { loadData, managerName } from '../data.js';
import { getSaved, toggleSaved, getTrips, saveTrip } from '../store.js';
import { loadAlerts, alertsForPlace } from '../alerts.js';
import { permitSummary, staleNote, sourcesList, alertCard, suggestEditUrl, ICONS } from '../components.js';
import { share, copy, SITE } from '../native.js';

const BANNER = {
  closed: 'Closed. Do not go. Check the official source for updates.',
  removed: 'Removed or made inaccessible. There is no legal way in. Please do not go.',
  no_public_access: 'No public access. Entering is trespassing. Please do not go.',
  restricted: 'Access is restricted. Read the rules below before going.',
  seasonal: 'Open only part of the year. Check the dates below.',
};

export default async function ({ params }) {
  const d = await loadData();
  const p = d.placeById[params.id];
  if (!p) return { title: 'Not found', html: html`<div class="card"><h1>Place not found</h1><a class="btn" href="#/">Go home</a></div>` };
  const closed = ['closed', 'removed', 'no_public_access'].includes(p.status);
  const saved = (await getSaved()).includes(p.id);
  const fees = p.fees ? Object.entries(p.fees).filter(([k]) => k !== 'note') : [];
  const n = p.permits_required.length;
  const facts = [
    p.max_stay_nights ? ['Max stay', `${p.max_stay_nights} nights`] : null,
    p.group_size_limit ? ['Group size', `Up to ${p.group_size_limit}`] : null,
    p.booking?.method && p.booking.method !== 'none' ? ['Booking', ({ online: 'Online', in_person: 'In person', phone: 'By phone', mail: 'By mail', owner_direct: 'Direct from the owner' })[p.booking.method]] : null,
    p.booking?.phone ? ['Phone', p.booking.phone] : null,
  ].filter(Boolean);

  const page = html`
    <div class="place-head">
      <div class="eyebrow">${d.islandById[p.island]?.name} · ${landWord(p.land_type)} land${p.moku ? ` · ${p.moku}` : ''}</div>
      <h1>${p.name}</h1>
      <div class="meta">${statusBadge(p.status)}<span class="muted">Managed by ${managerName(p)}</span></div>
    </div>
    ${BANNER[p.status] ? html`<div class="status-banner ${closed ? 'danger' : 'warn'}">${BANNER[p.status]}</div>` : ''}
    ${p.summary ? html`<p>${p.summary}</p>` : ''}
    <div class="actions-bar">
      <button class="btn tonal" id="save" aria-pressed="${saved}">${raw(saved ? ICONS.saved : ICONS.save)}<span>${saved ? 'Saved' : 'Save'}</span></button>
      <button class="btn tonal" id="share">${raw(ICONS.share)}<span>Share</span></button>
      <button class="btn tonal" id="trip">${raw(ICONS.add)}<span>Add to trip</span></button>
    </div>
    ${staleNote(p.last_verified)}
    <div class="section-head"><h2>What you need${n ? html`<span class="count">${n}</span>` : ''}</h2></div>
    ${n ? p.permits_required.map((pr, i) => permitSummary(d.permitById[pr.permit], pr.when, i + 1)) : html`<div class="card none-card"><div class="big">${closed ? 'No permits are issued' : 'No permit needed'}</div><p class="muted" style="margin:0">${closed ? 'This place is not open to the public.' : 'Normal park rules still apply. Check the hours and rules below.'}</p></div>`}
    ${p.booking?.url || p.booking?.window_note ? html`<div class="card"><h3>Booking</h3>${p.booking.window_note ? html`<p class="small">${p.booking.window_note}</p>` : ''}${p.booking.url ? html`<a class="btn small" href="${p.booking.url}" target="_blank" rel="noopener">${raw(ICONS.ext)} Book on the official site</a>` : ''}</div>` : ''}
    <div id="alerts"></div>
    ${fees.length || facts.length ? html`<div class="section-head"><h2>At a glance</h2></div><div class="card"><dl class="facts">${facts.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}${fees.map(([k, v]) => html`<dt>${k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())}</dt><dd>${money(v)}</dd>`)}</dl>${p.fees?.note ? html`<p class="muted" style="margin:0">${p.fees.note}</p>` : ''}</div>` : ''}
    ${p.activities.length ? html`<div class="section-head"><h2>Activities</h2></div><div class="chips">${p.activities.map((a) => html`<span class="chip">${d.activityById[a]?.name || a}</span>`)}</div>` : ''}
    ${p.hazards?.length ? html`<div class="section-head"><h2>Hazards</h2></div><div class="row">${p.hazards.map((h) => html`<span class="hazard">⚠ ${hazardWord(h)}</span>`)}</div>` : ''}
    ${p.rules?.length ? html`<div class="section-head"><h2>Rules</h2></div><div class="card"><ul style="margin:0">${p.rules.map((r) => html`<li>${r}</li>`)}</ul></div>` : ''}
    ${p.amenities?.length ? html`<div class="section-head"><h2>Amenities</h2></div><p>${p.amenities.join(', ')}</p>` : ''}
    ${p.accessibility ? html`<div class="section-head"><h2>Accessibility</h2></div><p>${p.accessibility}</p>` : ''}
    ${p.cultural_notes ? html`<div class="section-head"><h2>Cultural notes</h2></div><p>${p.cultural_notes}</p>` : ''}
    ${!closed ? html`<div class="row" style="margin:1rem 0"><a class="btn ghost small" href="#/map?focus=${p.id}">${raw(ICONS.map)} Show on map</a><a class="btn ghost small" href="https://www.google.com/maps/dir/?api=1&destination=${p.location.lat},${p.location.lng}" target="_blank" rel="noopener">${raw(ICONS.ext)} Directions</a></div>` : ''}
    ${sourcesList(p.sources, p.last_verified)}
    <p class="small"><a href="${suggestEditUrl(p)}" target="_blank" rel="noopener">Something wrong? Suggest an edit</a>${p.owner_claimed ? html` · Confirmed by the owner` : ''}</p>`;

  return {
    title: p.name, html: page,
    async mount(root) {
      root.querySelector('#save').addEventListener('click', async (e) => { const b = e.currentTarget; const on = await toggleSaved(p.id); b.innerHTML = `${on ? ICONS.saved : ICONS.save}<span>${on ? 'Saved' : 'Save'}</span>`; b.setAttribute('aria-pressed', on); });
      root.querySelector('#share').addEventListener('click', async () => {
        const url = `${SITE}#/place/${p.id}`;
        const ok = await share({ title: p.name, text: `${p.name}: what permits you need, on Hawaiʻi Permits.`, url });
        if (!ok) toast((await copy(url)) ? 'Link copied' : url);
      });
      root.querySelector('#trip').addEventListener('click', async () => {
        const trips = await getTrips();
        let trip = trips.find((t) => !t.stops.some((s) => s.place === p.id)) || trips[0] || { id: uid(), name: 'My trip', stops: [] };
        if (!trip.stops.some((s) => s.place === p.id)) trip.stops.push({ place: p.id, activities: [], start: '', end: '' });
        await saveTrip(trip);
        toast(`Added to ${trip.name}`);
        location.hash = `#/plan/${trip.id}`;
      });
      const all = await loadAlerts();
      const list = alertsForPlace(all, p);
      if (list.length) root.querySelector('#alerts').innerHTML = `<div class="section-head"><h2>Alerts</h2></div>${list.slice(0, 3).map((a) => alertCard(a).s).join('')}`;
    },
  };
}
