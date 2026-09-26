import { html, raw, uid, fmtDate, fmtDateTime, toast, money } from '../ui.js';
import { loadData, data } from '../data.js';
import { getTrips, saveTrip, deleteTrip, getChecks, setChecks } from '../store.js';
import { buildChecklist, remindersForTrip, encodeTrip, nightsBetween } from '../planner.js';
import { addReminder, removeReminder, listReminders } from '../reminders.js';
import { share, copy, SITE } from '../native.js';
import { search } from '../search.js';
import { howWord } from '../components.js';

export default async function ({ params }) {
  const d = await loadData();
  const trips = await getTrips();
  if (!params.id) return listView(trips);
  const trip = trips.find((t) => t.id === params.id);
  if (!trip) return { title: 'Trip not found', html: html`<div class="card"><h1>Trip not found</h1><a class="btn" href="#/plan">All trips</a></div>` };
  return tripView(trip, d);
}

function listView(trips) {
  return {
    title: 'Plan a trip',
    html: html`<h1>Plan a trip</h1>
      <p>Add places and dates. Ala builds a checklist of every permit, license, and reservation you need, in order, and tells you when booking opens.</p>
      <button class="btn" id="new">New trip</button>
      ${trips.length ? html`<h2>Your trips</h2>${trips.map((t) => html`<a class="card" href="#/plan/${t.id}"><strong>${t.name || 'Untitled trip'}</strong><div class="small muted">${t.stops.length} stop${t.stops.length === 1 ? '' : 's'}${t.stops[0]?.start ? ` · from ${fmtDate(t.stops.map((s) => s.start).filter(Boolean).sort()[0])}` : ''}</div></a>`)}` : html`<p class="muted" style="margin-top:1rem">No trips yet. Trips are saved only on this device.</p>`}`,
    mount(root) { root.querySelector('#new').addEventListener('click', async () => { const t = await saveTrip({ id: uid(), name: 'My trip', stops: [] }); location.hash = `#/plan/${t.id}`; }); },
  };
}

function tripView(trip, d) {
  const render = async (root) => {
    const cl = buildChecklist(trip, d);
    const checks = await getChecks(trip.id);
    const reminders = await listReminders();
    const possible = remindersForTrip(trip, cl);
    root.querySelector('#stops').innerHTML = trip.stops.length ? trip.stops.map((s, i) => {
      const p = d.placeById[s.place];
      if (!p) return '';
      return html`<div class="card" data-i="${i}">
        <div class="row" style="justify-content:space-between"><strong><a href="#/place/${p.id}">${p.name}</a></strong><button class="btn secondary small" data-remove="${i}">Remove</button></div>
        <div class="row"><div style="flex:1"><label for="s${i}">Arrive</label><input id="s${i}" type="date" data-start="${i}" value="${s.start}"></div><div style="flex:1"><label for="e${i}">Leave</label><input id="e${i}" type="date" data-end="${i}" value="${s.end}"></div></div>
        <div class="chips" role="group" aria-label="Activities at ${p.name}">${p.activities.map((a) => html`<button type="button" class="chip" data-act="${a}" data-stop="${i}" aria-pressed="${s.activities.includes(a)}">${d.activityById[a]?.name || a}</button>`)}</div>
      </div>`.s;
    }).join('') : '<p class="muted">No stops yet. Search below to add a place.</p>';
    root.querySelector('#warnings').innerHTML = cl.warnings.map((w) => `<div class="status-banner ${w.level === 'danger' ? 'danger' : w.level === 'warn' ? 'warn' : 'ok'}">${w.text}</div>`).join('');
    root.querySelector('#checklist').innerHTML = cl.items.length ? `<ul class="list checklist">${cl.items.map((it) => {
      const b = it.booking;
      const rem = possible.find((r) => r.id === `booking:${trip.id}:${it.permit.id}`);
      const has = rem && reminders.some((r) => r.id === rem.id);
      return html`<li><input type="checkbox" id="c-${it.permit.id}" data-check="${it.permit.id}" ${checks[it.permit.id] ? 'checked' : ''}><div>
        <label for="c-${it.permit.id}" style="margin:0"><a href="#/permit/${it.permit.id}">${it.permit.name}</a></label>
        ${it.prerequisiteFor.length ? html`<div class="small">Needed first, before: ${it.prerequisiteFor.join(', ')}</div>` : ''}
        ${it.stops.length ? html`<div class="small muted">For ${it.stops.map((s) => s.place.name).join(', ')}</div>` : ''}
        ${it.whens.length ? html`<div class="small">${it.whens.join(' ')}</div>` : ''}
        <div class="small">${howWord(it.permit.how_to_get)}${it.issuer ? ` from ${it.issuer.name}` : ''}${it.permit.cost ? ` · ${[it.permit.cost.resident != null ? `resident ${money(it.permit.cost.resident)}` : '', it.permit.cost.nonresident != null ? `nonresident ${money(it.permit.cost.nonresident)}` : ''].filter(Boolean).join(', ')}` : ''}</div>
        ${b.state === 'open' ? html`<div class="small" style="color:var(--ok)">Booking is open now${b.opensOn ? ` (opened ${fmtDate(b.opensOn)})` : ''}.</div>` : b.state === 'not_yet' ? html`<div class="small" style="color:var(--warn)">Booking opens ${fmtDateTime(b.opensAt)}. ${rem ? html`<button type="button" class="chip" data-rem="${rem.id}" aria-pressed="${!!has}">${has ? 'Reminder set' : 'Remind me'}</button>` : ''}</div>` : it.stops.length ? html`<div class="small muted">No fixed booking window. ${b.note || ''}</div>` : ''}
        <a class="small" href="${it.permit.url}" target="_blank" rel="noopener">Official page ↗</a>
      </div></li>`.s;
    }).join('')}</ul>` : '<p class="muted">Add places and dates to see your checklist.</p>';
    if (cl.islands.length) root.querySelector('#islands').textContent = cl.islands.map((i) => d.islandById[i].name).join(', ');
    const tripStart = possible.find((r) => r.type === 'trip_soon');
    const ts = root.querySelector('#trip-soon');
    if (tripStart) { const has = reminders.some((r) => r.id === tripStart.id); ts.innerHTML = html`<button type="button" class="chip" data-rem="${tripStart.id}" aria-pressed="${has}">${has ? 'Reminder set: check alerts the day before' : 'Remind me to check alerts the day before'}</button>`.s; } else ts.innerHTML = '';

    root.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', async () => { trip.stops.splice(Number(b.dataset.remove), 1); await saveTrip(trip); render(root); }));
    root.querySelectorAll('[data-start]').forEach((i) => i.addEventListener('change', async () => { const s = trip.stops[Number(i.dataset.start)]; s.start = i.value; if (!s.end || s.end < s.start) s.end = s.start; await saveTrip(trip); render(root); }));
    root.querySelectorAll('[data-end]').forEach((i) => i.addEventListener('change', async () => { trip.stops[Number(i.dataset.end)].end = i.value; await saveTrip(trip); render(root); }));
    root.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', async () => { const s = trip.stops[Number(b.dataset.stop)]; const on = !s.activities.includes(b.dataset.act); s.activities = on ? [...s.activities, b.dataset.act] : s.activities.filter((a) => a !== b.dataset.act); await saveTrip(trip); render(root); }));
    root.querySelectorAll('[data-check]').forEach((c) => c.addEventListener('change', async () => { checks[c.dataset.check] = c.checked; await setChecks(trip.id, checks); }));
    root.querySelectorAll('[data-rem]').forEach((b) => b.addEventListener('click', async () => {
      const r = possible.find((x) => x.id === b.dataset.rem);
      if (b.getAttribute('aria-pressed') === 'true') { await removeReminder(r.id); toast('Reminder removed'); }
      else { const item = await addReminder(r); toast(item.native ? 'Reminder set' : 'Reminder set. Open Ala around that time to see it.'); }
      render(root);
    }));
  };

  return {
    title: trip.name || 'Trip',
    html: html`<div class="row" style="justify-content:space-between"><h1 style="margin:0"><label for="name" class="sr-only">Trip name</label><input id="name" value="${trip.name}" style="font-size:1.3rem;font-weight:700;border:0;background:transparent;padding:0"></h1><a class="small" href="#/plan">All trips</a></div>
      <p class="muted small" id="islands"></p>
      <h2>Stops</h2>
      <div id="stops"></div>
      <div class="card"><label for="add">Add a place</label><input id="add" type="search" placeholder="Search a place to add" autocomplete="off"><div id="add-results"></div></div>
      <div id="warnings"></div>
      <h2>Your checklist</h2>
      <div id="checklist"></div>
      <div id="trip-soon" style="margin:.5rem 0"></div>
      <div class="row" style="margin-top:1rem"><button class="btn secondary" id="share">Share trip link</button><button class="btn danger" id="del">Delete trip</button></div>
      <p class="muted small">Trips stay on this device. A shared link carries the trip inside the link itself, nothing is uploaded.</p>`,
    async mount(root) {
      await render(root);
      root.querySelector('#name').addEventListener('change', async (e) => { trip.name = e.target.value.trim() || 'My trip'; await saveTrip(trip); });
      const add = root.querySelector('#add'); const res = root.querySelector('#add-results');
      let t;
      add.addEventListener('input', () => { clearTimeout(t); t = setTimeout(async () => {
        const r = (await search(add.value, { limit: 8 })).filter((x) => x.kind === 'place');
        res.innerHTML = r.map((x) => `<button type="button" class="chip" data-add="${x.id}">${d.placeById[x.id].name}</button>`).join(' ');
        res.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', async () => { trip.stops.push({ place: b.dataset.add, activities: [], start: trip.stops.at(-1)?.end || '', end: '' }); await saveTrip(trip); add.value = ''; res.innerHTML = ''; render(root); }));
      }, 120); });
      root.querySelector('#share').addEventListener('click', async () => {
        const url = `${SITE}#/trip?t=${encodeTrip(trip)}`;
        const ok = await share({ title: trip.name, text: `My Hawaiʻi trip plan on Ala`, url });
        if (!ok) toast((await copy(url)) ? 'Link copied' : 'Could not copy');
      });
      root.querySelector('#del').addEventListener('click', async (e) => {
        if (e.target.dataset.sure) { await deleteTrip(trip.id); location.hash = '#/plan'; return; }
        e.target.dataset.sure = '1'; e.target.textContent = 'Tap again to delete';
      });
    },
  };
}
