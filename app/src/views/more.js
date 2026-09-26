import { html } from '../ui.js';
export default async function () {
  const items = [['#/learn', 'Learn', 'Being pono outdoors, safety, and how permits work'], ['#/alerts', 'Alerts', 'Weather and park alerts by island'], ['#/settings', 'Settings', 'Island, theme, offline maps, notifications'], ['#/about', 'About and contribute', 'What Hawaiʻi Permits is and how to help'], ['#/privacy', 'Privacy', 'No accounts, no tracking, no ads']];
  return { title: 'More', html: html`<h1>More</h1><ul class="list">${items.map(([h, t, s]) => html`<li><a href="${h}"><div class="t">${t}</div><div class="muted small">${s}</div></a></li>`)}</ul>` };
}
