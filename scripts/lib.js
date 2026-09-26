// Shared helpers for build scripts.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import { load as yamlLoad } from 'js-yaml';

export const ROOT = new URL('..', import.meta.url).pathname;
export const DATA = join(ROOT, 'data');
export const OUT = join(ROOT, 'app/public/data');

/** Recursively list files with an extension. */
export function walk(dir, ext = '.yaml') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, ext));
    else if (name.endsWith(ext)) out.push(p);
  }
  return out.sort();
}

/** Load a YAML file, returning { file, id, data }. */
export function loadYaml(file) {
  const data = yamlLoad(readFileSync(file, 'utf8'));
  return { file: relative(ROOT, file), fileId: basename(file, '.yaml'), data };
}

/** Load every data file. */
export function loadAll() {
  return {
    places: walk(join(DATA, 'places')).map(loadYaml),
    permits: walk(join(DATA, 'permits')).map(loadYaml),
    agencies: walk(join(DATA, 'agencies')).map(loadYaml),
    islands: yamlLoad(readFileSync(join(DATA, 'islands.yaml'), 'utf8')),
    activities: yamlLoad(readFileSync(join(DATA, 'activities.yaml'), 'utf8')),
  };
}

/** Days between a YYYY-MM-DD date and today. */
export function daysSince(dateStr) {
  return Math.floor((Date.now() - Date.parse(dateStr)) / 86400000);
}

export const STALE_DAYS = 90;
