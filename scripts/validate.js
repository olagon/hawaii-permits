// Validate every YAML data file against its schema and check cross references.
import { readFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ROOT, loadAll, daysSince, STALE_DAYS } from './lib.js';

const schemaDir = join(ROOT, 'schema');
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(JSON.parse(readFileSync(join(schemaDir, 'common.json'), 'utf8')));
const validators = {};
for (const kind of ['place', 'permit', 'agency']) {
  validators[kind] = ajv.compile(JSON.parse(readFileSync(join(schemaDir, `${kind}.schema.json`), 'utf8')));
}

// Bounding box for the Hawaiian Islands, including Papahānaumokuākea.
const HI_BOX = { west: -178.5, east: -154.5, south: 18.7, north: 28.6 };

const all = loadAll();
const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const activityIds = new Set(all.activities.map((a) => a.id));
const islandIds = new Set(all.islands.map((i) => i.id));
const permitIds = new Set(all.permits.map((p) => p.data?.id));
const agencyIds = new Set(all.agencies.map((a) => a.data?.id));
const placeIds = new Set(all.places.map((p) => p.data?.id));

function checkSchema(kind, entry) {
  if (!validators[kind](entry.data)) {
    for (const e of validators[kind].errors) err(entry.file, `${e.instancePath || '/'} ${e.message}${e.params?.additionalProperty ? ` (${e.params.additionalProperty})` : ''}`);
    return false;
  }
  if (entry.data.id !== entry.fileId) err(entry.file, `id "${entry.data.id}" does not match file name`);
  return true;
}

for (const p of all.places) {
  if (!checkSchema('place', p)) continue;
  const d = p.data;
  const islandDir = basename(dirname(p.file));
  if (islandDir !== d.island) err(p.file, `island "${d.island}" does not match folder "${islandDir}"`);
  if (!islandIds.has(d.island)) err(p.file, `unknown island ${d.island}`);
  const { lat, lng } = d.location;
  if (lat < HI_BOX.south || lat > HI_BOX.north || lng < HI_BOX.west || lng > HI_BOX.east) err(p.file, `location ${lat},${lng} is outside Hawaiʻi`);
  for (const a of d.activities) if (!activityIds.has(a)) err(p.file, `unknown activity ${a}`);
  for (const pr of d.permits_required) if (!permitIds.has(pr.permit)) err(p.file, `unknown permit ${pr.permit}`);
  if (/^[a-z0-9-]+$/.test(d.manager) && !agencyIds.has(d.manager)) warn(p.file, `manager "${d.manager}" looks like an id but no agency file exists`);
  if (daysSince(d.last_verified) > STALE_DAYS) warn(p.file, `last_verified ${d.last_verified} is older than ${STALE_DAYS} days`);
}
for (const p of all.permits) {
  if (!checkSchema('permit', p)) continue;
  const d = p.data;
  if (!agencyIds.has(d.issuer)) err(p.file, `unknown issuer ${d.issuer}`);
  for (const c of d.covers || []) if (!placeIds.has(c)) err(p.file, `covers unknown place ${c}`);
  for (const q of d.prerequisites || []) if (!permitIds.has(q)) err(p.file, `unknown prerequisite ${q}`);
  if (daysSince(d.last_verified) > STALE_DAYS) warn(p.file, `last_verified ${d.last_verified} is older than ${STALE_DAYS} days`);
}
for (const a of all.agencies) {
  if (!checkSchema('agency', a)) continue;
  for (const i of a.data.islands || []) if (!islandIds.has(i)) err(a.file, `unknown island ${i}`);
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(`\n${all.places.length} places, ${all.permits.length} permits, ${all.agencies.length} agencies. ${errors.length} errors, ${warnings.length} warnings.`);
process.exit(errors.length ? 1 : 0);
