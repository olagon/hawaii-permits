// MiniSearch options shared by the build script and the app, so the prebuilt index matches.

/** Strip ʻokina, kahakō, and other marks so "kaena" matches "Kaʻena" and "Kōkeʻe" matches "kokee". */
export function normalize(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ʻ‘’'`]/g, '')
    .toLowerCase();
}

export const searchOptions = {
  fields: ['name', 'aliases', 'extra'],
  storeFields: ['kind', 'name', 'island'],
  tokenize: (text) => normalize(text).split(/[\s,/()-]+/).filter(Boolean),
  processTerm: (term) => (term.length > 1 ? term : null),
  searchOptions: { prefix: true, fuzzy: 0.2, boost: { name: 3, aliases: 2 } },
};
