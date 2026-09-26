import { html } from '../ui.js';
import { PRIVACY_HTML } from '../privacy-text.js';
export default async function () { return { title: 'Privacy', html: html`${PRIVACY_HTML}` }; }
