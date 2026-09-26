import { html, money } from '../ui.js';
import { loadData } from '../data.js';
import { placeCard, staleNote, sourcesList, howWord } from '../components.js';

export default async function ({ params }) {
  const d = await loadData();
  const p = d.permitById[params.id];
  if (!p) return { title: 'Not found', html: html`<div class="card"><h1>Permit not found</h1><a class="btn" href="#/">Go home</a></div>` };
  const issuer = d.agencyById[p.issuer];
  const covers = new Set([...(p.covers || []), ...d.places.filter((pl) => pl.permits_required.some((x) => x.permit === p.id)).map((pl) => pl.id)]);
  const w = p.booking_window;
  return {
    title: p.name,
    html: html`<h1>${p.name}</h1>
      <p class="muted">${p.category.replace(/_/g, ' ')} · issued by ${issuer ? html`<a href="${issuer.website}" target="_blank" rel="noopener">${issuer.name}</a>` : p.issuer}</p>
      ${staleNote(p.last_verified)}
      <div class="card">
        <p><strong>Who needs it:</strong> ${p.who_needs}</p>
        <p><strong>How to get it:</strong> ${howWord(p.how_to_get)}</p>
        ${p.cost ? html`<p><strong>Cost:</strong> ${[p.cost.resident != null ? `Resident ${money(p.cost.resident)}` : '', p.cost.nonresident != null ? `Nonresident ${money(p.cost.nonresident)}` : ''].filter(Boolean).join(', ')}${p.cost.unit ? ` ${p.cost.unit}` : ''}${p.cost.note ? `. ${p.cost.note}` : ''}</p>` : ''}
        ${w ? html`<p><strong>Booking window:</strong> ${w.opens_days_before != null ? `Opens ${w.opens_days_before} days before your date${w.opens_time_local ? ` at ${w.opens_time_local} HST` : ''}.` : ''} ${w.notes || ''}</p>` : ''}
        ${p.valid_for ? html`<p><strong>Valid for:</strong> ${p.valid_for}</p>` : ''}
        ${p.resident_rules ? html`<p><strong>Residents:</strong> ${p.resident_rules}</p>` : ''}
        ${p.age_minimum ? html`<p><strong>Minimum age:</strong> ${p.age_minimum}</p>` : ''}
        ${p.refund_policy ? html`<p><strong>Refunds:</strong> ${p.refund_policy}</p>` : ''}
        <p>${p.carry_required ? 'Carry this permit with you. Add a copy to your Permit Wallet.' : 'You do not need to carry a paper copy, but it is a good idea to save one in your wallet.'}</p>
        <a class="btn" href="${p.url}" target="_blank" rel="noopener">Official page ↗</a>
      </div>
      ${p.prerequisites?.length ? html`<h2>You need these first</h2>${p.prerequisites.map((q) => d.permitById[q] ? html`<a class="card" href="#/permit/${q}"><strong>${d.permitById[q].name}</strong></a>` : '')}` : ''}
      ${covers.size ? html`<h2>Places that use this</h2>${[...covers].map((id) => d.placeById[id]).filter(Boolean).map(placeCard)}` : ''}
      ${sourcesList(p.sources, p.last_verified)}`,
  };
}
