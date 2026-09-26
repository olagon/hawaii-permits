import { raw } from './ui.js';
export const PRIVACY_HTML = raw(`
<h1>Privacy policy</h1>
<p class="muted">Ala by Kealoha Labs. Last updated 2026-09-25.</p>
<p>Ala collects no personal data. There are no accounts, no tracking, no analytics, and no ads.</p>
<h2>What stays on your device</h2>
<p>Saved places, trips, permit wallet files, reminders, settings, offline map packs, and a cached copy of the data. All of it is stored only on your phone or in your browser. Ala never uploads any of it. Clearing data in Settings removes it all.</p>
<h2>What leaves your device</h2>
<ul>
<li>When online, Ala downloads the latest data and alerts from the Ala website (GitHub Pages). This is a normal web request. GitHub may log the request like any website host.</li>
<li>The map loads tiles from OpenFreeMap when online. Map tile requests include the map area you are looking at. See the OpenFreeMap and OpenStreetMap privacy pages.</li>
<li>If you tap a link to an official booking site, you leave Ala and that site's privacy policy applies.</li>
</ul>
<h2>Location</h2>
<p>"Near me" on the map asks for your location and uses it only to center the map. It is not stored or sent anywhere.</p>
<h2>Notifications</h2>
<p>Reminders you set are scheduled on your device. Nothing is sent to a server.</p>
<h2>Children</h2>
<p>Ala does not collect data from anyone, including children.</p>
<h2>Changes</h2>
<p>If this policy changes, the date above changes and the new text is published here and in the source code at https://github.com/olagon/ala.</p>
<h2>Contact</h2>
<p>Open an issue at https://github.com/olagon/ala/issues.</p>
`);
