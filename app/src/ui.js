// Tiny HTML helpers. Views build strings with html`...` which escapes values by default.
class Raw { constructor(s) { this.s = s; } }
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** Mark a string as already safe HTML. */
export const raw = (s) => new Raw(s);
const val = (v) => (v instanceof Raw ? v.s : Array.isArray(v) ? v.map(val).join('') : v == null || v === false ? '' : esc(v));
/** Tagged template that escapes interpolated values. Arrays are joined, Raw is passed through. */
export const html = (strings, ...values) => new Raw(strings.reduce((out, s, i) => out + s + (i < values.length ? val(values[i]) : ''), ''));
/** Render a Raw or string to a string. */
export const str = (v) => (v instanceof Raw ? v.s : String(v ?? ''));

const STATUS_WORDS = { open: 'Open', closed: 'Closed', seasonal: 'Seasonal', restricted: 'Restricted access', no_public_access: 'No public access', removed: 'Removed' };
const LAND_WORDS = { state: 'State', county: 'County', federal: 'Federal', private: 'Private', private_nonprofit: 'Nonprofit', trust: 'Trust', military: 'Military', mixed: 'Mixed' };
const HAZARD_WORDS = { flash_flood: 'Flash flood risk', stream_crossings: 'Stream crossings', falling_rock: 'Falling rock', high_surf: 'High surf', steep_drop: 'Steep drops', mud: 'Mud', heat: 'Heat', cold: 'Cold', altitude: 'High altitude', hunting_area: 'Hunting area', no_water: 'No drinking water', remote: 'Remote, no cell service' };
export const statusWord = (s) => STATUS_WORDS[s] || s;
export const landWord = (l) => LAND_WORDS[l] || l;
export const hazardWord = (h) => HAZARD_WORDS[h] || h;
export const statusBadge = (s) => html`<span class="badge ${s}">${statusWord(s)}</span>`;
export const money = (v, unit = '') => (v === 'see_source' ? 'see official source' : v === 0 ? 'Free' : v == null ? '' : `$${Number(v).toFixed(v % 1 ? 2 : 0)}${unit}`);
export const fmtDate = (d) => (d ? new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' HST' : '');
export const daysSince = (d) => Math.floor((Date.now() - Date.parse(d)) / 86400000);
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

let toastTimer;
/** Show a short message at the bottom of the screen. */
export function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 3000);
}
