import { html, statusBadge, landWord, toast } from '../ui.js';
import { loadData, managerName } from '../data.js';
import { permitWords, closedStatus } from '../components.js';
import { getSettings, setSetting } from '../store.js';
import { getPosition } from '../native.js';

const LAND = [['state', 'State'], ['county', 'County'], ['federal', 'Federal'], ['private', 'Private'], ['private_nonprofit', 'Nonprofit'], ['trust', 'Trust'], ['military', 'Military'], ['mixed', 'Mixed']];
const STATUS = [['open', 'Open'], ['seasonal', 'Seasonal'], ['restricted', 'Restricted'], ['closed', 'Closed'], ['no_public_access', 'No access'], ['removed', 'Removed']];

export default async function ({ query }) {
  const d = await loadData();
  const s = await getSettings();
  const focus = query.focus ? d.placeById[query.focus] : null;
  const island = focus ? focus.island : d.islandById[s.island] ? s.island : 'oahu';
  return {
    title: 'Map', className: 'map-page',
    html: html`<h1 class="sr-only">Map</h1>
      <div class="map-wrap">
        <div id="map" role="application" aria-label="Map of places on ${d.islandById[island].name}"></div>
        <div class="map-tools">
          <div class="row"><label for="island" class="sr-only">Island</label><select id="island" style="width:auto;min-width:8rem">${d.islands.filter((i) => d.places.some((p) => p.island === i.id)).map((i) => html`<option value="${i.id}" ${i.id === island ? 'selected' : ''}>${i.name}</option>`)}</select>
          <label for="act" class="sr-only">Activity</label><select id="act" style="width:auto"><option value="">Any activity</option>${d.activities.map((a) => html`<option value="${a.id}">${a.name}</option>`)}</select></div>
          <div class="chips" role="group" aria-label="Filters">
            <button type="button" class="chip" data-f="nopermit" aria-pressed="false">No permit needed</button>
            ${LAND.map(([k, v]) => html`<button type="button" class="chip" data-f="land:${k}" aria-pressed="false">${v}</button>`)}
            ${STATUS.map(([k, v]) => html`<button type="button" class="chip" data-f="status:${k}" aria-pressed="false">${v}</button>`)}
          </div>
        </div>
        <div class="legend" aria-label="Legend">
          <div><span class="mk" style="background:#1a7f4b;border-radius:50%"></span> S State</div>
          <div><span class="mk" style="background:#2c67b3;border-radius:3px"></span> C County</div>
          <div><span class="mk" style="background:#7b3fa0;border-radius:50% 50% 50% 0"></span> F Federal</div>
          <div><span class="mk" style="background:#b8641b;clip-path:polygon(50% 0,100% 100%,0 100%);border:0"></span> P Private</div>
          <div><span class="mk" style="background:#0b7c8c;border-radius:50%;border-style:dashed"></span> T Trust</div>
          <div><span class="mk" style="background:#a11a1a;transform:rotate(45deg)"></span> ! Closed</div>
        </div>
        <button type="button" class="btn near-me" id="near">Near me</button>
        <div class="sheet" id="sheet" hidden></div>
      </div>`,
    async mount(root) {
      const M = await import('../map.js');
      const isl = d.islandById[island];
      const { map, offline } = await M.createMap(root.querySelector('#map'), island, { center: focus ? focus.location : isl.center, zoom: focus ? 13 : isl.zoom, offline: !navigator.onLine || s.preferOfflineMap });
      if (offline) toast('Using your offline map pack');
      const sheet = root.querySelector('#sheet');
      const filters = new Set();
      let markers = [];
      const openSheet = (p) => {
        sheet.hidden = false;
        sheet.innerHTML = html`<button class="icon-btn close" aria-label="Close">✕</button>
          <h2 style="margin-top:0;padding-right:2.5rem">${p.name}</h2>
          <div class="row">${statusBadge(p.status)}<span class="badge land">${landWord(p.land_type)}</span></div>
          <p class="muted small">${managerName(p)}</p>
          ${closedStatus(p.status) ? html`<p class="notice">Not open to the public. Please do not go.</p>` : html`<p class="small">${p.permits_required.length ? p.permits_required.map((x) => d.permitById[x.permit]?.name).filter(Boolean).join(', ') : permitWords(p)}</p>`}
          <a class="btn" href="#/place/${p.id}">Full details</a>`.s;
        sheet.querySelector('.close').addEventListener('click', () => { sheet.hidden = true; });
        sheet.querySelector('h2').focus?.();
      };
      const draw = () => {
        markers.forEach((m) => m.remove());
        const cur = root.querySelector('#island').value;
        const act = root.querySelector('#act').value;
        const lands = [...filters].filter((f) => f.startsWith('land:')).map((f) => f.slice(5));
        const statuses = [...filters].filter((f) => f.startsWith('status:')).map((f) => f.slice(7));
        markers = d.places.filter((p) => p.island === cur && (!act || p.activities.includes(act)) && (!filters.has('nopermit') || (p.permits_required.length === 0 && p.status === 'open'))
          && (!lands.length || lands.includes(p.land_type)) && (!statuses.length || statuses.includes(p.status)))
          .map((p) => M.placeMarker(map, p, openSheet));
      };
      map.on('load', draw);
      map.on('click', () => { sheet.hidden = true; });
      root.querySelector('#island').addEventListener('change', async (e) => { const i = d.islandById[e.target.value]; await setSetting('island', i.id); map.flyTo({ center: [i.center.lng, i.center.lat], zoom: i.zoom }); draw(); });
      root.querySelector('#act').addEventListener('change', draw);
      for (const b of root.querySelectorAll('.chip[data-f]')) b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); if (on) filters.add(b.dataset.f); else filters.delete(b.dataset.f); draw(); });
      root.querySelector('#near').addEventListener('click', async () => {
        try { const pos = await getPosition(); M.userMarker(map, pos); map.flyTo({ center: [pos.lng, pos.lat], zoom: 12 }); }
        catch { toast('Could not get your location. Check location permission.'); }
      });
      if (focus) map.once('load', () => openSheet(focus));
      this.unmount = () => map.remove();
    },
  };
}
