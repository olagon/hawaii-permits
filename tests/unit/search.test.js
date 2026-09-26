import { describe, it, expect } from 'vitest';
import MiniSearch from 'minisearch';
import { normalize, searchOptions } from '../../app/src/search-options.js';

describe('search normalization', () => {
  it('strips ʻokina and kahakō', () => {
    expect(normalize('Kaʻena')).toBe('kaena');
    expect(normalize('Kōkeʻe')).toBe('kokee');
    expect(normalize('Hāʻena')).toBe('haena');
    expect(normalize("Ka'ena")).toBe('kaena');
  });
  it('finds names with or without diacritics', () => {
    const ms = new MiniSearch(searchOptions);
    ms.addAll([{ id: 'place:kaena', kind: 'place', name: 'Kaʻena Point State Park', aliases: 'Kaena', island: 'oahu', extra: '' }, { id: 'place:kokee', kind: 'place', name: 'Kōkeʻe State Park', aliases: '', island: 'kauai', extra: '' }]);
    expect(ms.search('kaena')[0].id).toBe('place:kaena');
    expect(ms.search('Kaʻena')[0].id).toBe('place:kaena');
    expect(ms.search('kokee')[0].id).toBe('place:kokee');
    expect(ms.search('koke')[0].id).toBe('place:kokee');
    // Prebuilt index round trip keeps the same behavior.
    const again = MiniSearch.loadJSON(JSON.stringify(ms), searchOptions);
    expect(again.search('Kōkeʻe')[0].id).toBe('place:kokee');
  });
});
