import { html } from '../ui.js';
import { loadData } from '../data.js';
import { ISSUE_URL } from '../components.js';

export default async function () {
  const d = await loadData();
  const c = d.manifest?.counts || {};
  return {
    title: 'About',
    html: html`<h1>About Ala</h1>
      <p>Ala means path or trail. Ala is a free, open source app that tells you which permits, licenses, and reservations you need to hike, camp, hunt, fish, or visit outdoor places in Hawaiʻi. It covers state, county, federal, private, nonprofit, and trust land in one place.</p>
      <div class="notice">Ala is not an official government app. It is made by volunteers. When Ala and an official source disagree, the official source wins. Always confirm on the official page before you go.</div>
      <p>Right now Ala lists ${c.places || 0} places, ${c.permits || 0} permits, and ${c.agencies || 0} agencies. Data updated ${d.manifest?.date ? new Date(d.manifest.date).toLocaleDateString() : 'unknown'}.</p>
      <h2>Privacy</h2><p>No accounts. No tracking. No ads. Nothing you save leaves your device. See the <a href="#/privacy">privacy page</a>.</p>
      <h2>Contribute</h2>
      <p>Found a wrong fee, a new closure, or a missing campground? You can help.</p>
      <ul>
        <li><a href="${ISSUE_URL}?template=add-place.yml" target="_blank" rel="noopener">Add a place ↗</a></li>
        <li><a href="${ISSUE_URL}?template=report-change.yml" target="_blank" rel="noopener">Report a change ↗</a></li>
        <li><a href="${ISSUE_URL}?template=owner-claim.yml" target="_blank" rel="noopener">Claim a place you own or manage ↗</a></li>
        <li><a href="https://github.com/olagon/ala" target="_blank" rel="noopener">Source code and data on GitHub ↗</a></li>
      </ul>
      <p>Owners and managers who claim a place get a "confirmed by owner" mark once a maintainer checks the claim.</p>
      <h2>Licenses</h2><p>Code is MIT. Data is CC BY 4.0. Each data file credits the agency or owner it came from. Map data © OpenStreetMap contributors, tiles by OpenFreeMap and Protomaps.</p>
      <h2>Thank you</h2><p>Olin Lagon (Kealoha Labs) started Ala. Thank you to everyone who reports a change, and to the agency staff who keep the official pages current. Contributor names appear on the GitHub repo.</p>`,
  };
}
