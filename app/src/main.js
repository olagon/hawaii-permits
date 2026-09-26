// App entry. Sets theme, wires native, registers routes, starts the router.
import { registerSW } from 'virtual:pwa-register';
import { route, startRouter } from './router.js';
import { getSettings } from './store.js';
import { initNative, onNetworkChange } from './native.js';
import { dueReminders } from './reminders.js';
import { toast } from './ui.js';

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme; else delete root.dataset.theme;
}

route('/', () => import('./views/home.js'));
route('/map', () => import('./views/map.js'));
route('/search', () => import('./views/search.js'));
route('/place/:id', () => import('./views/place.js'));
route('/permit/:id', () => import('./views/permit.js'));
route('/plan', () => import('./views/plan.js'));
route('/plan/:id', () => import('./views/plan.js'));
route('/trip', () => import('./views/trip-import.js'));
route('/wallet', () => import('./views/wallet.js'));
route('/more', () => import('./views/more.js'));
route('/learn', () => import('./views/learn.js'));
route('/learn/:slug', () => import('./views/learn.js'));
route('/alerts', () => import('./views/alerts.js'));
route('/about', () => import('./views/about.js'));
route('/contribute', () => import('./views/about.js'));
route('/privacy', () => import('./views/privacy.js'));
route('/settings', () => import('./views/settings.js'));

(async () => {
  const s = await getSettings();
  applyTheme(s.theme);
  await initNative().catch(console.warn);
  // Check for a new version on launch and every hour while open, so fixes land without a manual reload.
  let swReg = null;
  registerSW({ immediate: true, onRegisteredSW(url, reg) { swReg = reg; if (reg) setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000); } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') swReg?.update().catch(() => {}); });
  const banner = document.getElementById('banner');
  onNetworkChange((online) => {
    banner.hidden = online;
    banner.textContent = online ? '' : 'You are offline. Saved data still works. Live alerts and online map tiles are paused.';
  });
  startRouter();
  const due = await dueReminders().catch(() => []);
  if (due.length) toast(due.length === 1 ? due[0].title : `${due.length} reminders are due. See Plan.`);
})();
