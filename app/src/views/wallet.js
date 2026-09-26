import { html, fmtDate, toast } from '../ui.js';
import { loadData } from '../data.js';
import { getTrips } from '../store.js';
import { listWallet, addToWallet, walletFile, removeFromWallet } from '../wallet.js';
import { addReminder, removeReminder } from '../reminders.js';
import { hstInstant, addDays } from '../planner.js';

export default async function () {
  const d = await loadData();
  const trips = await getTrips();
  const render = async (root) => {
    const items = await listWallet();
    const list = root.querySelector('#items');
    list.innerHTML = items.length ? '' : '<p class="muted">No permits saved yet. Add a photo, screenshot, or PDF of each permit so you can show it even with no signal.</p>';
    for (const it of items) {
      const el = document.createElement('div');
      el.className = 'card wallet-item';
      const place = d.placeById[it.placeId]; const trip = trips.find((t) => t.id === it.tripId);
      el.innerHTML = html`<div class="row" style="justify-content:space-between"><strong>${it.name}</strong><span class="muted small">${fmtDate(it.added)}</span></div>
        <div class="small muted">${place ? html`<a href="#/place/${place.id}">${place.name}</a>` : ''}${trip ? ` · ${trip.name}` : ''}${it.expires ? ` · Expires ${fmtDate(it.expires)}` : ''}</div>
        ${it.notes ? html`<p class="small">${it.notes}</p>` : ''}
        <div class="preview" style="margin:.5rem 0"></div>
        <div class="row"><button class="btn" data-show>Show full screen</button><button class="btn secondary small" data-del>Delete</button></div>`.s;
      const file = await walletFile(it);
      const url = file ? URL.createObjectURL(file) : '';
      const pv = el.querySelector('.preview');
      if (file && it.mime.startsWith('image/')) pv.innerHTML = `<img src="${url}" alt="${it.name}">`;
      else if (file) pv.innerHTML = `<p class="small">${it.mime === 'application/pdf' ? 'PDF' : 'File'} · ${Math.round(it.size / 1024)} KB</p>`;
      else pv.innerHTML = '<p class="notice">File missing on this device.</p>';
      el.querySelector('[data-show]').addEventListener('click', () => {
        const full = document.createElement('div');
        full.className = 'wallet-full'; full.setAttribute('role', 'dialog'); full.setAttribute('aria-label', it.name);
        full.innerHTML = (it.mime.startsWith('image/') ? `<img src="${url}" alt="${it.name}">` : `<iframe src="${url}" title="${it.name}"></iframe>`) + '<button class="btn close" aria-label="Close">Close</button>';
        full.querySelector('.close').addEventListener('click', () => full.remove());
        document.body.appendChild(full); full.querySelector('.close').focus();
      });
      el.querySelector('[data-del]').addEventListener('click', async (e) => {
        if (!e.target.dataset.sure) { e.target.dataset.sure = 1; e.target.textContent = 'Tap again to delete'; return; }
        await removeFromWallet(it.id); await removeReminder(`expire:${it.id}`); render(root);
      });
      list.appendChild(el);
    }
  };
  return {
    title: 'Permit wallet',
    html: html`<h1>Permit wallet</h1>
      <p>Keep a copy of every permit here. Files stay on this device only. They are never uploaded.</p>
      <form class="card" id="f">
        <label for="file">Photo, screenshot, or PDF</label><input id="file" type="file" accept="image/*,application/pdf" required>
        <label for="name">Name</label><input id="name" placeholder="Kalalau camping permit" required>
        <label for="place">Place (optional)</label><select id="place"><option value="">None</option>${d.places.filter((p) => p.permits_required.length).map((p) => html`<option value="${p.id}">${p.name}</option>`)}</select>
        <label for="trip">Trip (optional)</label><select id="trip"><option value="">None</option>${trips.map((t) => html`<option value="${t.id}">${t.name}</option>`)}</select>
        <label for="exp">Expires (optional)</label><input id="exp" type="date">
        <label for="notes">Notes (optional)</label><input id="notes" placeholder="Site 4, 2 nights">
        <button class="btn" style="margin-top:1rem">Add to wallet</button>
      </form>
      <div id="items"></div>`,
    async mount(root) {
      await render(root);
      root.querySelector('#f').addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = root.querySelector('#file').files[0];
        if (!file) return;
        const item = await addToWallet({ file, name: root.querySelector('#name').value.trim(), placeId: root.querySelector('#place').value, tripId: root.querySelector('#trip').value, expires: root.querySelector('#exp').value, notes: root.querySelector('#notes').value.trim() });
        if (item.expires) await addReminder({ id: `expire:${item.id}`, type: 'permit_expiring', at: hstInstant(addDays(item.expires, -1), '09:00'), title: `${item.name} expires tomorrow`, body: 'Renew it if you still need it.', route: '#/wallet' });
        e.target.reset(); toast('Saved to wallet'); render(root);
      });
    },
  };
}
