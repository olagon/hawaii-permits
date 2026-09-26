// Cloudflare Worker: accepts a simple form and opens a GitHub issue on olagon/ala,
// for people without GitHub accounts. Not deployed yet. See HUMAN_TODO.md.
const REPO = 'olagon/ala';
const ALLOWED_ORIGINS = ['https://olagon.github.io', 'capacitor://localhost', 'http://localhost'];
const LABELS = { add: ['data', 'add-place'], change: ['data', 'report-change'], claim: ['data', 'owner-claim'] };

const cors = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.some((o) => origin?.startsWith(o)) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

export default {
  async fetch(request, env) {
    const headers = cors(request.headers.get('Origin'));
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    if (request.method !== 'POST') return new Response('POST only', { status: 405, headers });
    let body;
    try { body = await request.json(); } catch { return new Response('Bad JSON', { status: 400, headers }); }
    const kind = LABELS[body.kind] ? body.kind : 'change';
    const name = String(body.place_name || '').trim().slice(0, 120);
    const details = String(body.details || '').trim().slice(0, 4000);
    if (!name || !details) return new Response('place_name and details are required', { status: 400, headers });
    if (String(body.website || '')) return new Response('ok', { headers }); // honeypot field filled by bots
    const md = [
      `**Place:** ${name}`, body.place_id ? `**Place id:** ${String(body.place_id).slice(0, 80)}` : '',
      body.source ? `**Source:** ${String(body.source).slice(0, 500)}` : '', '', details, '', '_Sent through the Ala no-account form._',
    ].filter((l) => l !== null).join('\n');
    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'ala-worker', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `[${kind}] ${name}`, body: md, labels: LABELS[kind] }),
    });
    if (!res.ok) return new Response('GitHub error', { status: 502, headers });
    const issue = await res.json();
    return new Response(JSON.stringify({ url: issue.html_url }), { headers: { ...headers, 'Content-Type': 'application/json' } });
  },
};
