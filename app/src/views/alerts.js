import { html, fmtDateTime } from '../ui.js';
import { loadData } from '../data.js';
import { getSettings } from '../store.js';
import { loadAlerts, alertsForIsland } from '../alerts.js';
import { alertCard, islandPicker } from '../components.js';

export default async function () {
  const d = await loadData();
  const s = await getSettings();
  const all = await loadAlerts();
  return {
    title: 'Alerts',
    html: html`<h1>Alerts</h1>
      <p class="muted small">${all.updated ? `Updated ${fmtDateTime(all.updated)}.` : 'No alert data yet.'}${all.offline ? ' You are offline, so this may be out of date.' : ''} Sources: National Weather Service, National Park Service, DLNR news.</p>
      <div id="islands" class="island-picker"></div><div id="list" aria-live="polite"></div>`,
    mount(root) {
      const draw = (island) => { const list = alertsForIsland(all, island); root.querySelector('#list').innerHTML = list.length ? list.map((a) => alertCard(a).s).join('') : '<p class="muted">No active alerts for this island.</p>'; };
      root.querySelector('#islands').replaceWith(islandPicker(s.island, draw));
      draw(s.island);
    },
  };
}
