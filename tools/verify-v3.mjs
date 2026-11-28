// Verify release 3.0.0: every referenced asset must resolve inside the world archive
// or inside a module the world declares, and no snow may remain.
import fs from 'node:fs';
import path from 'node:path';
import { ClassicLevel } from 'classic-level';

const ROOT = path.resolve(import.meta.dir, '..');
const BUILD = path.join(ROOT, 'build/world-v3');
const ASSETS_MODULE = path.join(ROOT, 'build/goldwater-assets');
const DATA = 'C:/Users/user1/AppData/Local/FoundryVTT/Data';
const CORE = 'C:/Program Files/Foundry Virtual Tabletop/resources/app';
const WORLD_ID = 'goldwater-cuckold';

const fail = (m) => { throw new Error(m); };

async function eachDoc(dir, fn) {
  const db = new ClassicLevel(dir, { keyEncoding: 'buffer', valueEncoding: 'buffer', createIfMissing: false });
  await db.open();
  try {
    for await (const [k, v] of db.iterator()) {
      let doc;
      try { doc = JSON.parse(v.toString('utf8')); } catch { continue; }
      await fn(k.toString('utf8'), doc);
    }
  } finally { await db.close(); }
}

// ---- roots that a path can live in. The shipped archives are the source of truth,
// not the staging folders: a file missing from the zip is missing for the user.
// Info-ZIP on Windows decodes entry names as CP866 and mangles Cyrillic, so read the
// central directory ourselves and honour the UTF-8 filename flag (bit 11).
const zipEntries = (zipPath, strip) => {
  const out = new Set();
  if (!fs.existsSync(zipPath)) return out;
  const buf = fs.readFileSync(zipPath);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) fail(`no EOCD in ${zipPath}`);
  const count = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) fail(`bad central header in ${zipPath}`);
    const flags = buf.readUInt16LE(ptr + 8);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const raw = buf.slice(ptr + 46, ptr + 46 + nameLen);
    const name = flags & 0x0800 ? raw.toString('utf8') : raw.toString('latin1');
    ptr += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith('/')) continue;
    out.add(strip ? name.replace(new RegExp(`^${strip}/`), '') : name);
  }
  return out;
};
const WORLD_ZIP = zipEntries(path.join(ROOT, 'dist/v3.0.0/world.zip'), null);
const ASSETS_ZIP = zipEntries(path.join(ROOT, 'dist/goldwater-assets.zip'), 'goldwater-assets');

const roots = [
  { prefix: `worlds/${WORLD_ID}/`, zip: WORLD_ZIP },
  { prefix: 'modules/goldwater-assets/', zip: ASSETS_ZIP },
  { prefix: 'modules/fxmaster/', dir: path.join(DATA, 'modules/fxmaster') },
  { prefix: 'modules/token-variants/', dir: path.join(DATA, 'modules/token-variants') },
  { prefix: 'systems/worldofdarkness/', dir: path.join(DATA, 'systems/worldofdarkness') },
  { prefix: 'icons/', dir: path.join(CORE, 'public/icons') },
  { prefix: 'ui/', dir: path.join(CORE, 'public/ui') },
  { prefix: 'sounds/', dir: path.join(CORE, 'public/sounds') },
];
const dec = (s) => { try { return decodeURI(s); } catch { return s; } };
const resolvePath = (p) => {
  const clean = dec(p).split('?')[0];
  for (const r of roots) {
    if (!clean.startsWith(r.prefix)) continue;
    const rel = clean.slice(r.prefix.length);
    return r.zip ? { zipHit: r.zip.has(rel), rel } : { abs: path.join(r.dir, rel) };
  }
  return null;
};

const EXTERNAL_OK = /^(modules\/(?!goldwater-assets|fxmaster|token-variants)[\w-]+\/|http|data:|blob:)/;

const refs = new Map();       // path -> first place it was seen
const missing = [];
const external = new Set();
let docCount = 0;

const addRef = (p, where) => {
  if (typeof p !== 'string' || !p) return;
  if (!/\.(png|jpe?g|webp|gif|svg|mp4|webm|ogg|mp3|m4a|wav|pdf|txt|json)$/i.test(p)) return;
  if (EXTERNAL_OK.test(p)) { external.add(p.split('/').slice(0, 2).join('/')); return; }
  if (refs.has(p)) return;
  refs.set(p, where);
  const hit = resolvePath(p);
  if (!hit) { missing.push({ path: p, where, why: 'путь вне известных корней' }); return; }
  const ok = hit.zipHit !== undefined ? hit.zipHit : fs.existsSync(hit.abs);
  if (!ok) missing.push({ path: p, where, why: hit.zipHit !== undefined ? 'нет в архиве релиза' : 'файл отсутствует' });
};

const dirs = fs.readdirSync(path.join(BUILD, 'data'), { withFileTypes: true })
  .filter(e => e.isDirectory()).map(e => path.join(BUILD, 'data', e.name));

for (const dir of dirs) {
  const coll = path.basename(dir);
  await eachDoc(dir, (key, doc) => {
    docCount++;
    const where = `${coll}:${doc.name ?? doc._id ?? key}`;
    // every string field that looks like an asset reference
    const walk = (o) => {
      if (typeof o === 'string') { addRef(o, where); return; }
      if (Array.isArray(o)) { for (const x of o) walk(x); return; }
      if (o && typeof o === 'object') for (const x of Object.values(o)) walk(x);
    };
    walk(doc);
  });
}

// ---- world descriptor
const world = JSON.parse(fs.readFileSync(path.join(BUILD, 'world.json'), 'utf8'));
addRef(world.background, 'world.json:background');

// ---- content checks
const problems = [];
if (world.version !== '3.0.0') problems.push(`version is ${world.version}`);
if (world.id !== WORLD_ID) problems.push('world id changed');
if (world.coreVersion !== '12.331') problems.push('coreVersion changed');
const reqIds = (world.relationships?.requires ?? []).map(r => r.id).sort();
for (const need of ['fxmaster', 'goldwater-assets', 'token-variants']) {
  if (!reqIds.includes(need)) problems.push(`missing required module ${need}`);
}
if ((world.relationships?.recommends ?? []).some(r => /tom-?cartos/i.test(r.id))) problems.push('Tom Cartos still recommended');
if (JSON.stringify(world).includes('releases/download/v1.1.0')) problems.push('stale pinned URL');

const report = {
  docs: docCount,
  assetRefs: refs.size,
  missing,
  externalRoots: [...external].sort(),
  problems,
};
fs.writeFileSync(path.join(ROOT, 'audit/verify-v3.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ docs: docCount, assetRefs: refs.size, missing: missing.length, externalRoots: report.externalRoots, problems }, null, 2));
if (missing.length) {
  console.log('\n--- missing sample ---');
  for (const m of missing.slice(0, 25)) console.log(m.why, '|', m.path, '|', m.where);
}
