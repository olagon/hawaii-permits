import { html, statusBadge, landWord, toast } from '../ui.js';
import { loadData, managerName } from '../data.js';
import { permitWords, closedStatus } from '../components.js';
import { getSettings, setSetting } from '../store.js';
import { getPosition } from '../native.js';

const LAND = [['state', 'State'], ['county', 'County'], ['federal', 'Federal'], ['private', 'Private'], ['private_nonprofit', 'Nonprofit'], ['trust', 'Trust'], ['military', 'Military'], ['mixed', 'Mixed']];

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
          <div class="seg" role="radiogroup" aria-label="Show">
            <button type="button" class="seg-btn" data-show="all" role="radio" aria-checked="true">All</button>
            <button type="button" class="seg-btn" data-show="open" role="radio" aria-checked="false">Open</button>
            <button type="button" class="seg-btn" data-show="nopermit" role="radio" aria-checked="false">No permit</button>
            <button type="button" class="seg-btn" data-show="closed" role="radio" aria-checked="false">Closed</button>
          </div>
          <div class="row"><label for="land" class="sr-only">Land type</label><select id="land" style="width:auto"><option value="">Any land type</option>${LAND.map(([k, v]) => html`<option value="${k}">${v}</option>`)}</select></div>
        </div>
        <div class="legend" aria-label="Legend">
          <div><span class="mk state"></span> S State</div>
          <div><span class="mk county"></span> C County</div>
          <div><span class="mk federal"></span> F Federal</div>
          <div><span class="mk private"></span> P Private</div>
          <div><span class="mk trust"></span> T Trust</div>
          <div><span class="mk warn"></span> ! Closed</div>
        </div>
        <span class="map-count" id="count" aria-live="polite"></span>
        <button type="button" class="btn near-me" id="near">Near me</button>
        <div class="sheet" id="sheet" hidden></div>
      </div>`,
    async mount(root) {
      const M = await import('../map.js');
      const isl = d.islandById[island];
      const { map, offline } = await M.createMap(root.querySelector('#map'), island, { center: focus ? focus.location : isl.center, zoom: focus ? 13 : isl.zoom, offline: !navigator.onLine || s.preferOfflineMap });
      if (offline) toast('Using your offline map pack');
      const sheet = root.querySelector('#sheet');
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
      let show = 'all';
      const draw = () => {
        markers.forEach((m) => m.remove());
        const cur = root.querySelector('#island').value;
        const act = root.querySelector('#act').value;
        const land = root.querySelector('#land').value;
        const closedSet = ['closed', 'removed', 'no_public_access'];
        markers = d.places.filter((p) => p.island === cur && (!act || p.activities.includes(act)) && (!land || p.land_type === land)
          && (show === 'all' || (show === 'open' && p.status === 'open') || (show === 'nopermit' && p.status === 'open' && p.permits_required.length === 0) || (show === 'closed' && closedSet.includes(p.status))))
          .map((p) => M.placeMarker(map, p, openSheet));
        root.querySelector('#count').textContent = `${markers.length} place${markers.length === 1 ? '' : 's'}`;
      };
      map.on('load', draw);
      map.on('click', () => { sheet.hidden = true; });
      root.querySelector('#island').addEventListener('change', async (e) => { const i = d.islandById[e.target.value]; await setSetting('island', i.id); map.flyTo({ center: [i.center.lng, i.center.lat], zoom: i.zoom }); draw(); });
      root.querySelector('#act').addEventListener('change', draw);
      root.querySelector('#land').addEventListener('change', draw);
      for (const b of root.querySelectorAll('.seg-btn')) b.addEventListener('click', () => { show = b.dataset.show; root.querySelectorAll('.seg-btn').forEach((x) => x.setAttribute('aria-checked', String(x === b))); draw(); });
      root.querySelector('#near').addEventListener('click', async () => {
        try {
          const pos = await getPosition();
          // Switch to the island you are on, so the markers around you show.
          const inside = d.islands.find((i) => pos.lng >= i.bounds[0] && pos.lat >= i.bounds[1] && pos.lng <= i.bounds[2] && pos.lat <= i.bounds[3]);
          const nearest = inside || d.islands.reduce((a, b) => (Math.hypot(a.center.lat - pos.lat, a.center.lng - pos.lng) < Math.hypot(b.center.lat - pos.lat, b.center.lng - pos.lng) ? a : b));
          if (d.places.some((p) => p.island === nearest.id) && root.querySelector('#island').value !== nearest.id) { root.querySelector('#island').value = nearest.id; await setSetting('island', nearest.id); draw(); }
          M.userMarker(map, pos);
          map.flyTo({ center: [pos.lng, pos.lat], zoom: inside ? 12 : nearest.zoom });
          if (!inside) toast(`You are not on an island in the data. Showing ${nearest.name}.`);
        } catch { toast('Could not get your location. Check location permission.'); }
      });
      if (focus) map.once('load', () => openSheet(focus));
      this.unmount = () => map.remove();
    },
  };
}
