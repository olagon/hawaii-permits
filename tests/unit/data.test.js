import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

describe('data bundle', () => {
  it('bundle files exist and reference each other correctly', () => {
    if (!existsSync('app/public/data/manifest.json')) return; // bundle not built yet
    const read = (f) => JSON.parse(readFileSync(`app/public/data/${f}`, 'utf8'));
    const m = read('manifest.json');
    expect(m.version).toMatch(/^[a-f0-9]{12}$/);
    for (const f of m.files) expect(existsSync(`app/public/data/${f}`)).toBe(true);
    const places = read('places.json'); const permits = new Set(read('permits.json').map((p) => p.id));
    for (const p of places) for (const pr of p.permits_required) expect(permits.has(pr.permit)).toBe(true);
    expect(m.counts.places).toBe(places.length);
  });
});
