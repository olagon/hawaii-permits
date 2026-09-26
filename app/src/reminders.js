// Reminders. Native: local notifications. Web: in app reminders on launch, plus the Notification API when allowed.
import { get, set } from './store.js';
import { isNative, scheduleNotification, cancelNotification } from './native.js';

const KEY = 'reminders';
export const listReminders = async () => (await get(KEY)) || [];

const numericId = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 2147483647; };

export async function addReminder(r) {
  const all = (await listReminders()).filter((x) => x.id !== r.id);
  const item = { ...r, shown: false, native: false };
  if (isNative()) item.native = await scheduleNotification({ id: numericId(r.id), title: r.title, body: r.body, at: r.at });
  else if ('Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch {} }
  await set(KEY, [...all, item]);
  return item;
}
export async function removeReminder(id) {
  if (isNative()) await cancelNotification(numericId(id));
  await set(KEY, (await listReminders()).filter((x) => x.id !== id));
}

/** Reminders whose time has come and were not shown yet. Marks them shown. Fires a web Notification if allowed. */
export async function dueReminders() {
  const all = await listReminders();
  const now = Date.now();
  const due = all.filter((r) => !r.shown && Date.parse(r.at) <= now);
  if (!due.length) return [];
  for (const r of due) {
    r.shown = true;
    if (!isNative() && 'Notification' in window && Notification.permission === 'granted') { try { new Notification(r.title, { body: r.body }); } catch {} }
  }
  await set(KEY, all.filter((r) => Date.parse(r.at) > now - 30 * 86400000));
  return due;
}
