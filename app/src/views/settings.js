import { html, toast } from '../ui.js';
import { loadData, refreshData } from '../data.js';
import { getSettings, setSetting, clearAll } from '../store.js';
import { applyTheme } from '../main.js';
import { isNative } from '../native.js';

export default async function () {
  const d = await loadData();
  const s = await getSettings();
  const M = await import('../map.js');
  const islands = d.islands.filter((i) => !['niihau', 'kahoolawe'].includes(i.id));
  const packs = Object.fromEntries(await Promise.all(islands.map(async (i) => [i.id, await M.packSize(i.id)])));
  return {
    title: 'Settings',
    html: html`<h1>Settings</h1>
      <div class="card"><label for="island">Home island</label><select id="island">${islands.map((i) => html`<option value="${i.id}" ${i.id === s.island ? 'selected' : ''}>${i.name}</option>`)}</select>
      <label for="theme">Theme</label><select id="theme">${[['system', 'Match device'], ['light', 'Light'], ['dark', 'Dark']].map(([v, t]) => html`<option value="${v}" ${v === s.theme ? 'selected' : ''}>${t}</option>`)}</select></div>
      <div class="card"><h2>Data</h2><p class="small">Data updated ${d.manifest?.date ? new Date(d.manifest.date).toLocaleString() : 'unknown'} (version ${d.manifest?.version || '?'}). Ala checks for new data each time it opens.</p><button class="btn secondary" id="refresh">Check for new data now</button></div>
      <div class="card"><h2>Offline maps</h2><p class="small">Download an island pack to see the map with no signal. Packs are a few dozen MB each.</p>
        <ul class="list" id="packs">${islands.map((i) => html`<li class="row" style="justify-content:space-between"><span>${i.name}${packs[i.id] ? html` <span class="muted small">(${Math.round(packs[i.id] / 1048576)} MB saved)</span>` : ''}</span><button class="btn secondary small" data-pack="${i.id}" data-has="${!!packs[i.id]}">${packs[i.id] ? 'Remove' : 'Download'}</button></li>`)}</ul>
        <label style="display:flex;gap:.5rem;align-items:center;font-weight:400"><input type="checkbox" id="prefer" style="width:24px;min-height:0" ${s.preferOfflineMap ? 'checked' : ''}> Always use saved packs, even online</label></div>
      <div class="card"><h2>Notifications</h2><p class="small">${isNative() ? 'Reminders use system notifications. You can turn them off in your phone settings.' : 'On the web, reminders show inside Ala when you open it. Allow browser notifications to also get a pop up.'}</p>${!isNative() ? html`<button class="btn secondary" id="notif">Allow browser notifications</button>` : ''}</div>
      <div class="card"><h2>Clear data</h2><p class="small">Removes saved places, trips, wallet files, reminders, offline maps, and cached data from this device.</p><button class="btn danger" id="clear">Clear all data</button></div>`,
    mount(root) {
      root.querySelector('#island').addEventListener('change', (e) => setSetting('island', e.target.value));
      root.querySelector('#theme').addEventListener('change', (e) => { setSetting('theme', e.target.value); applyTheme(e.target.value); });
      root.querySelector('#prefer').addEventListener('change', (e) => setSetting('preferOfflineMap', e.target.checked));
      root.querySelector('#refresh').addEventListener('click', async (e) => { e.target.disabled = true; try { const b = await refreshData(); toast(`Data version ${b.manifest.version} loaded`); location.reload(); } catch { toast('Could not reach the site. Try again when online.'); e.target.disabled = false; } });
      root.querySelector('#notif')?.addEventListener('click', async () => { const r = await Notification.requestPermission(); toast(r === 'granted' ? 'Notifications allowed' : 'Notifications not allowed'); });
      root.querySelectorAll('[data-pack]').forEach((b) => b.addEventListener('click', async () => {
        const id = b.dataset.pack;
        if (b.dataset.has === 'true') { await M.removePack(id); b.dataset.has = 'false'; b.textContent = 'Download'; toast('Pack removed'); return; }
        b.disabled = true;
        try { const size = await M.downloadPack(id, (f) => { b.textContent = `${Math.round(f * 100)}%`; }); b.dataset.has = 'true'; b.textContent = 'Remove'; toast(`Saved ${Math.round(size / 1048576)} MB`); }
        catch (err) { toast(err.message); b.textContent = 'Download'; }
        b.disabled = false;
      }));
      root.querySelector('#clear').addEventListener('click', async (e) => { if (!e.target.dataset.sure) { e.target.dataset.sure = 1; e.target.textContent = 'Tap again to clear everything'; return; } await clearAll(); location.hash = '#/'; location.reload(); });
    },
  };
}
