// Hash router. Routes look like "#/place/:id?query=1". Works on GitHub Pages and inside Capacitor.
const routes = [];
let current = null;

/** Register a route pattern like "/place/:id" with an async view loader. */
export function route(pattern, load) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:([a-z]+)/gi, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  routes.push({ re, keys, load });
}

/** Parse the current hash into path and query. */
export function parseHash(hash = location.hash) {
  const [path, qs = ''] = (hash.replace(/^#/, '') || '/').split('?');
  return { path, query: Object.fromEntries(new URLSearchParams(qs)) };
}

export const navigate = (path) => { location.hash = path; };

async function render() {
  const { path, query } = parseHash();
  const view = document.getElementById('view');
  for (const r of routes) {
    const m = path.match(r.re);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    if (current?.unmount) { try { current.unmount(); } catch {} }
    view.innerHTML = '<p class="muted">Loading…</p>';
    try {
      const mod = await r.load();
      const page = await mod.default({ params, query, path });
      current = page;
      document.title = page.title ? `${page.title} · Hawaiʻi Permits` : 'Hawaiʻi Permits';
      view.innerHTML = typeof page.html === 'string' ? page.html : page.html.s;
      view.className = page.className || '';
      if (page.mount) await page.mount(view);
    } catch (e) {
      console.error(e);
      view.innerHTML = `<div class="card"><h1>Something went wrong</h1><p>${e.message}</p><a class="btn" href="#/">Go home</a></div>`;
    }
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
    const section = path.split('/')[1] || 'home';
    for (const a of document.querySelectorAll('.bottom a')) {
      const active = a.dataset.nav === section || (a.dataset.nav === 'more' && ['learn', 'alerts', 'settings', 'about', 'privacy', 'contribute'].includes(section)) || (a.dataset.nav === 'home' && ['search', 'place', 'permit', 'trip'].includes(section));
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    }
    return;
  }
  view.innerHTML = '<div class="card"><h1>Page not found</h1><a class="btn" href="#/">Go home</a></div>';
}

export function startRouter() {
  window.addEventListener('hashchange', render);
  render();
}
