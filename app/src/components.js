// Shared bits of UI used by more than one view.
import { html, raw, statusBadge, landWord, money, fmtDate, fmtDateTime, daysSince } from './ui.js';
import { data, managerName } from './data.js';

export const ISSUE_URL = 'https://github.com/olagon/hawaii-permits/issues/new';

export const ICONS = {
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.2" fill="currentColor"/></svg>',
  plan: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8 12 2.5 2.5L16 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18" stroke="currentColor" stroke-width="2"/><circle cx="16.5" cy="14.5" r="1.3" fill="currentColor"/></svg>',
  learn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5a2.5 2.5 0 0 1 2.5 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  saved: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z" fill="currentColor"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m0 0L8 8m4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M9 6H6a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

export const closedStatus = (s) => ['closed', 'removed', 'no_public_access'].includes(s);
/** One line about what a place needs, never "no permit" for a place you cannot enter. */
export function permitWords(place) {
  const n = place.permits_required.length;
  if (closedStatus(place.status)) return 'Not open to the public';
  if (!n) return place.status === 'restricted' ? 'Restricted access, see rules' : 'No permit needed';
  return `${n} permit${n > 1 ? 's' : ''} or reservation${n > 1 ? 's' : ''}`;
}

/** Compact row for lists of places. */
export function placeRow(place) {
  const n = place.permits_required.length;
  return html`<li><a class="place-row" href="#/place/${place.id}">
    <span class="mk ${closedStatus(place.status) ? 'warn' : place.land_type}" aria-hidden="true"></span>
    <span><span class="name">${place.name}</span><span class="sub">${landWord(place.land_type)} · ${permitWords(place)}</span></span>
    ${place.status !== 'open' ? statusBadge(place.status) : ''}
  </a></li>`;
}
/** A list of place rows. */
export const placeList = (places) => html`<ul class="list">${places.map(placeRow)}</ul>`;
export const placeCard = placeRow;

export const howWord = (h) => ({ online: 'Online', in_person: 'In person', phone: 'By phone', mail: 'By mail', owner_direct: 'Direct from the owner', none: 'No booking' }[h] || h);
const catWord = (c) => ({ camping: 'Camping permit', cabin: 'Cabin reservation', day_use: 'Day use', parking: 'Parking', trail_access: 'Trail access', vehicle_access: 'Vehicle access', hunting_license: 'Hunting license', hunting_tag: 'Hunting tag or stamp', fishing_license: 'Fishing license', gathering: 'Gathering permit', commercial: 'Commercial permit', special_use: 'Special access', entry_reservation: 'Entry reservation' }[c] || c);

function costWords(cost) {
  if (!cost) return '';
  const parts = [];
  if (cost.resident != null) parts.push(`Resident ${money(cost.resident)}`);
  if (cost.nonresident != null) parts.push(`Nonresident ${money(cost.nonresident)}`);
  return parts.join(', ') + (cost.unit ? ` ${cost.unit}` : '') + (cost.note ? `. ${cost.note}` : '');
}

/** A permit card for a place page. */
export function permitSummary(permit, when, index) {
  const d = data();
  const issuer = d.agencyById[permit.issuer];
  const w = permit.booking_window;
  const window_ = w?.opens_days_before != null ? `Opens ${w.opens_days_before} days before${w.opens_time_local ? ` at ${w.opens_time_local} HST` : ''}.${w.notes ? ' ' + w.notes : ''}` : w?.notes || '';
  return html`<div class="card permit">
    <span class="num" aria-hidden="true"></span>
    <div class="eyebrow">${index ? `${index}. ` : ''}${catWord(permit.category)}</div>
    <h3><a href="#/permit/${permit.id}">${permit.name}</a></h3>
    ${when ? html`<p class="when">${when}</p>` : ''}
    <dl class="facts">
      <dt>Who</dt><dd>${permit.who_needs}</dd>
      <dt>How</dt><dd>${howWord(permit.how_to_get)}${issuer ? ` from ${issuer.name}` : ''}</dd>
      ${permit.cost ? html`<dt>Cost</dt><dd>${costWords(permit.cost)}</dd>` : ''}
      ${window_ ? html`<dt>Window</dt><dd>${window_}</dd>` : ''}
    </dl>
    <div class="permit-foot">
      <a class="btn small" href="${permit.url}" target="_blank" rel="noopener">${raw(ICONS.ext)} Official page</a>
      ${permit.carry_required ? html`<span class="carry">Carry it with you</span>` : ''}
    </div>
  </div>`;
}

export function staleNote(dateStr) {
  return daysSince(dateStr) > 90 ? html`<p class="notice">Last checked ${fmtDate(dateStr)}. This may be out of date. Check the official source.</p>` : '';
}

export function sourcesList(sources, lastVerified) {
  return html`<details class="card"><summary>Sources and last verified</summary>
    <ul class="small">${sources.map((s) => html`<li><a href="${s}" target="_blank" rel="noopener">${s.replace(/^https?:\/\/(www\.)?/, '').slice(0, 70)}</a></li>`)}</ul>
    <p class="muted">Last verified ${fmtDate(lastVerified)}. Hawaiʻi Permits is not an official government app. Official sources win.</p></details>`;
}

const SOURCE_WORDS = { nws: 'National Weather Service', nps: 'National Park Service', dlnr_news: 'DLNR news' };
/** Short area text: first few zones, then a count. */
function areaWords(area) {
  const parts = (area || '').split(/;\s*/).filter(Boolean);
  return parts.length > 3 ? `${parts.slice(0, 3).join(', ')} and ${parts.length - 3} more` : parts.join(', ');
}
export function alertCard(a) {
  const severe = /extreme|severe/i.test(a.severity) || /warning|closure/i.test(a.event);
  const title = a.source === 'nws' ? a.event : a.headline || a.event;
  return html`<div class="card alert ${severe ? 'severe' : ''}">
    <span class="dot" aria-hidden="true"></span>
    <div><div class="title">${title}</div><div class="meta">${SOURCE_WORDS[a.source] || a.source}${a.ends ? ` · until ${fmtDateTime(a.ends)}` : ''}${a.area ? html`<br>${areaWords(a.area)}` : ''}</div></div>
    ${a.description || a.headline ? html`<details><summary>Details</summary>${a.headline && a.source === 'nws' ? html`<p><strong>${a.headline}</strong></p>` : ''}<p>${a.description || ''}</p><a class="src" href="${a.url}" target="_blank" rel="noopener">Source</a></details>` : html`<a class="src" href="${a.url}" target="_blank" rel="noopener">Source</a>`}
  </div>`;
}

export function islandPicker(current, onPick) {
  const d = data();
  const el = document.createElement('div');
  el.className = 'island-picker';
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', 'Island');
  for (const i of d.islands.filter((x) => d.places.some((p) => p.island === x.id))) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = i.name;
    b.setAttribute('aria-pressed', String(i.id === current));
    b.addEventListener('click', () => { for (const c of el.children) c.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-pressed', 'true'); onPick(i.id); });
    el.appendChild(b);
  }
  return el;
}

export const suggestEditUrl = (place) => `${ISSUE_URL}?template=report-change.yml&title=${encodeURIComponent(`[change] ${place.name}`)}&place_id=${encodeURIComponent(place.id)}&place_name=${encodeURIComponent(place.name)}`;
