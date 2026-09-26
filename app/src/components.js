// Shared bits of UI used by more than one view.
import { html, statusBadge, landWord, money, fmtDate, fmtDateTime, daysSince } from './ui.js';
import { data, managerName } from './data.js';

export const ISSUE_URL = 'https://github.com/olagon/ala/issues/new';

export function placeCard(place) {
  const d = data();
  const acts = (place.activities || []).slice(0, 4).map((a) => d.activityById[a]?.name || a).join(' · ');
  const n = place.permits_required.length;
  return html`<a class="card" href="#/place/${place.id}">
    <div class="row" style="justify-content:space-between"><strong>${place.name}</strong>${statusBadge(place.status)}</div>
    <div class="muted">${landWord(place.land_type)} · ${managerName(place)}</div>
    <div class="small">${n ? `${n} permit${n > 1 ? 's' : ''} or reservation${n > 1 ? 's' : ''} listed` : 'No permit needed'}${acts ? ' · ' + acts : ''}</div>
  </a>`;
}

export function permitSummary(permit, when) {
  const d = data();
  const issuer = d.agencyById[permit.issuer];
  const cost = permit.cost ? [permit.cost.resident != null ? `Resident ${money(permit.cost.resident)}` : '', permit.cost.nonresident != null ? `Nonresident ${money(permit.cost.nonresident)}` : ''].filter(Boolean).join(', ') + (permit.cost.unit ? ` ${permit.cost.unit}` : '') : '';
  const w = permit.booking_window;
  const window_ = w?.opens_days_before != null ? `Booking opens ${w.opens_days_before} days before${w.opens_time_local ? ` at ${w.opens_time_local} HST` : ''}.` : '';
  return html`<div class="card">
    <h3><a href="#/permit/${permit.id}">${permit.name}</a></h3>
    ${when ? html`<p><strong>When:</strong> ${when}</p>` : ''}
    <p class="small"><strong>Who needs it:</strong> ${permit.who_needs}</p>
    <p class="small"><strong>How to get it:</strong> ${howWord(permit.how_to_get)}${issuer ? ` from ${issuer.name}` : ''}${cost ? `. Cost: ${cost}` : ''}${permit.cost?.note ? `. ${permit.cost.note}` : ''}</p>
    ${window_ ? html`<p class="small"><strong>Booking window:</strong> ${window_}${w.notes ? ' ' + w.notes : ''}</p>` : w?.notes ? html`<p class="small"><strong>Booking:</strong> ${w.notes}</p>` : ''}
    ${permit.carry_required ? html`<p class="small">Carry this permit with you.</p>` : ''}
    <a class="btn small" href="${permit.url}" target="_blank" rel="noopener">Official page ↗</a>
  </div>`;
}

export const howWord = (h) => ({ online: 'Online', in_person: 'In person', phone: 'By phone', mail: 'By mail', owner_direct: 'Direct from the owner', none: 'No booking' }[h] || h);

export function staleNote(dateStr) {
  return daysSince(dateStr) > 90 ? html`<p class="notice">Last checked ${fmtDate(dateStr)}. This may be out of date. Check the official source.</p>` : '';
}

export function sourcesList(sources, lastVerified) {
  return html`<details><summary>Sources and last verified</summary>
    <ul class="small">${sources.map((s) => html`<li><a href="${s}" target="_blank" rel="noopener">${s.replace(/^https?:\/\//, '').slice(0, 70)}</a></li>`)}</ul>
    <p class="muted">Last verified ${fmtDate(lastVerified)}. Ala is not an official government app. Official sources win.</p></details>`;
}

export function alertCard(a) {
  const severe = /extreme|severe/i.test(a.severity) || /warning|closure/i.test(a.event);
  return html`<div class="card alert ${severe ? 'severe' : ''}">
    <div class="kind">${a.source === 'nws' ? 'National Weather Service' : a.source === 'nps' ? 'National Park Service' : 'DLNR news'}</div>
    <strong>${a.headline || a.event}</strong>
    ${a.area ? html`<div class="muted small">${a.area}</div>` : ''}
    ${a.ends ? html`<div class="muted small">Until ${fmtDateTime(a.ends)}</div>` : ''}
    ${a.description ? html`<details><summary>Details</summary><p class="small" style="white-space:pre-wrap">${a.description}</p></details>` : ''}
    <a class="small" href="${a.url}" target="_blank" rel="noopener">Source ↗</a>
  </div>`;
}

export function islandPicker(current, onPick) {
  const d = data();
  const el = document.createElement('div');
  el.className = 'island-picker';
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', 'Island');
  for (const i of d.islands.filter((x) => !['niihau', 'kahoolawe'].includes(x.id) || d.places.some((p) => p.island === x.id))) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = i.name;
    b.setAttribute('aria-pressed', String(i.id === current));
    b.addEventListener('click', () => { for (const c of el.children) c.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-pressed', 'true'); onPick(i.id); });
    el.appendChild(b);
  }
  return el;
}

export const suggestEditUrl = (place) => `${ISSUE_URL}?template=report-change.yml&title=${encodeURIComponent(`[change] ${place.name}`)}&place_id=${encodeURIComponent(place.id)}&place_name=${encodeURIComponent(place.name)}`;
