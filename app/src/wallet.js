// Permit wallet. Files stay on the device: IndexedDB on the web, the app's data folder on native.
import { get, set, del } from './store.js';
import { isNative, files } from './native.js';
import { uid } from './ui.js';

export const listWallet = async () => (await get('wallet')) || [];

/** Add a file to the wallet. @returns the new item */
export async function addToWallet({ file, name, placeId, tripId, expires, notes }) {
  const item = { id: uid(), name: name || file.name, mime: file.type || 'application/octet-stream', size: file.size, placeId: placeId || '', tripId: tripId || '', expires: expires || '', notes: notes || '', added: new Date().toISOString() };
  if (isNative()) await files.write(item.id, file); else await set(`wallet:file:${item.id}`, file);
  await set('wallet', [...(await listWallet()), item]);
  return item;
}
export async function updateWalletItem(item) {
  await set('wallet', (await listWallet()).map((i) => (i.id === item.id ? item : i)));
}
export async function walletFile(item) {
  return isNative() ? files.read(item.id, item.mime) : get(`wallet:file:${item.id}`);
}
export async function removeFromWallet(id) {
  if (isNative()) await files.remove(id); else await del(`wallet:file:${id}`);
  await set('wallet', (await listWallet()).filter((i) => i.id !== id));
}
