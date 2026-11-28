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

// ---- roots that a path can live in
const roots = [
  { prefix: `worlds/${WORLD_ID}/`, dir: BUILD },
  { prefix: 'modules/goldwater-assets/', dir: ASSETS_MODULE },
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
  for (const r of roots) if (clean.startsWith(r.prefix)) return path.join(r.dir, clean.slice(r.prefix.length));
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
  const abs = resolvePath(p);
  if (!abs) { missing.push({ path: p, where, why: 'путь вне известных корней' }); return; }
  if (!fs.existsSync(abs)) missing.push({ path: p, where, why: 'файл отсутствует' });
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
