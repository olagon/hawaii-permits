// Capacitor detection and wrappers. Each function uses the native plugin on iOS and Android
// and falls back to a web API in the browser.
import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform();

/** Where the live data lives. Native apps always pull from the site; the web app uses its own origin. */
export const SITE = 'https://olagon.github.io/hawaii-permits/';

export async function initNative() {
  if (!isNative()) return;
  const [{ SplashScreen }, { StatusBar, Style }, { App }] = await Promise.all([
    import('@capacitor/splash-screen'), import('@capacitor/status-bar'), import('@capacitor/app'),
  ]);
  try { await StatusBar.setStyle({ style: Style.Dark }); } catch {}
  App.addListener('backButton', ({ canGoBack }) => { if (canGoBack) history.back(); else App.exitApp(); });
  App.addListener('appUrlOpen', ({ url }) => { const i = url.indexOf('#'); if (i >= 0) location.hash = url.slice(i); });
  await SplashScreen.hide();
}

/** Current position as { lat, lng }. Throws if denied. */
export async function getPosition() {
  if (isNative()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
    return { lat: p.coords.latitude, lng: p.coords.longitude };
  }
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
    (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }), reject, { enableHighAccuracy: true, timeout: 15000 }));
}

/** Share text and a link. Returns false if nothing could share (then the caller copies). */
export async function share({ title, text, url }) {
  if (isNative()) { const { Share } = await import('@capacitor/share'); await Share.share({ title, text, url, dialogTitle: title }); return true; }
  if (navigator.share) { try { await navigator.share({ title, text, url }); return true; } catch { return false; } }
  return false;
}

/** Copy text to the clipboard. */
export async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

/** Listen for online and offline changes. Calls cb(true) when online. */
export async function onNetworkChange(cb) {
  if (isNative()) {
    const { Network } = await import('@capacitor/network');
    cb((await Network.getStatus()).connected);
    Network.addListener('networkStatusChange', (s) => cb(s.connected));
    return;
  }
  cb(navigator.onLine);
  window.addEventListener('online', () => cb(true));
  window.addEventListener('offline', () => cb(false));
}

/** Small key value preferences. Native uses the Preferences plugin, web uses localStorage. */
export const prefs = {
  async get(key) {
    if (isNative()) { const { Preferences } = await import('@capacitor/preferences'); return (await Preferences.get({ key })).value; }
    try { return localStorage.getItem(key); } catch { return null; }
  },
  async set(key, value) {
    if (isNative()) { const { Preferences } = await import('@capacitor/preferences'); return Preferences.set({ key, value }); }
    try { localStorage.setItem(key, value); } catch {}
  },
};

/** Files for the permit wallet. Native writes to the app's private data folder. */
export const files = {
  async write(name, blob) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const data = await blobToBase64(blob);
    await Filesystem.writeFile({ path: `wallet/${name}`, data, directory: Directory.Data, recursive: true });
  },
  async read(name, mime) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const r = await Filesystem.readFile({ path: `wallet/${name}`, directory: Directory.Data });
    const bin = atob(r.data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  },
  async remove(name) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    try { await Filesystem.deleteFile({ path: `wallet/${name}`, directory: Directory.Data }); } catch {}
  },
};

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** Schedule a local notification on native. Returns false on web (reminders.js handles web). */
export async function scheduleNotification({ id, title, body, at }) {
  if (!isNative()) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== 'granted') return false;
  await LocalNotifications.schedule({ notifications: [{ id, title, body, schedule: { at: new Date(at) } }] });
  return true;
}
export async function cancelNotification(id) {
  if (!isNative()) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.cancel({ notifications: [{ id }] });
}
