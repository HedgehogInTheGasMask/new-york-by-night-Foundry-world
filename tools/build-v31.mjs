// Build Goldwater cuckold 3.1.0 on top of the finished 3.0.0 world:
//  - every actor that received a top-down token in 3.0.0 gets its original
//    pre-3.0.0 artwork back as an additional Token Variant Art variant,
//  - empty scene folders are deleted,
//  - nothing else (scenes, tokens, effects, game data) is touched.
//
// The 3.0.0 build folder is updated in place; data/actors and data/folders are
// copied to build/v30-snapshot first so the change is reversible.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ClassicLevel } from 'classic-level';
import { makeZip } from './zip.mjs';

const ROOT = path.resolve(import.meta.dir, '..');
const BUILD = path.join(ROOT, 'build/world-v3');
const SNAPSHOT = path.join(ROOT, 'build/v30-snapshot');
const ASSETS = path.join(ROOT, 'build/goldwater-assets');
const OLD_DIST = path.join(ROOT, 'dist/v3.0.0');
const VERSION = '3.1.0';
const WORLD_ID = 'goldwater-cuckold';
const OUT = path.join(ROOT, 'dist', `v${VERSION}`);

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const fail = (m) => { throw new Error(m); };

// ---------------------------------------------------------------- snapshot
if (!fs.existsSync(path.join(SNAPSHOT, 'actors'))) {
  fs.mkdirSync(SNAPSHOT, { recursive: true });
  for (const c of ['actors', 'folders']) {
    fs.cpSync(path.join(BUILD, 'data', c), path.join(SNAPSHOT, c), {
      recursive: true,
      filter: (s) => !/[\\/]LOCK$/.test(s),
    });
  }
  fs.copyFileSync(path.join(BUILD, 'world.json'), path.join(SNAPSHOT, 'world.json'));
  console.log('snapshot of the 3.0.0 actors/folders ->', SNAPSHOT);
} else {
  console.log('snapshot already present ->', SNAPSHOT);
}

async function withDb(dir, fn) {
  const db = new ClassicLevel(dir, { keyEncoding: 'buffer', valueEncoding: 'buffer' });
  await db.open();
  try { return await fn(db); } finally { await db.close(); }
}

const resolveAsset = (src) => {
  if (typeof src !== 'string' || !src) return null;
  const clean = (() => { try { return decodeURI(src); } catch { return src; } })();
  if (clean.startsWith('modules/goldwater-assets/')) return path.join(ASSETS, clean.slice('modules/goldwater-assets/'.length));
  return null;
};

// Original art that is itself a top-down token, or that cannot be attributed to
// the actor reliably: not offered as a portrait variant.
const NO_PORTRAIT = new Map([
  ['gIaLFCdwRJAupSdv', 'исходное изображение Алана Персона — уже top-down токен, портрета в мире нет'],
]);

// ---------------------------------------------------------------- actors
const portraits = [];
await withDb(path.join(BUILD, 'data/actors'), async (db) => {
  const b = db.batch();
  for await (const [k, v] of db.iterator()) {
    const key = k.toString('utf8');
    if (!/^!actors![^.]+$/.test(key)) continue;
    const doc = JSON.parse(v.toString('utf8'));
    const variants = doc.flags?.['token-variants']?.variants ?? [];
    if (!variants.length) continue;                       // never retokened in 3.0.0

    const img = doc.img;
    const file = resolveAsset(img);
    const exists = !!file && fs.existsSync(file);
    const placeholder = !img || /^icons\/svg\//.test(img) || /mystery-man/.test(img) || !exists;
    const entry = { id: doc._id, actor: doc.name, img, main: doc.prototypeToken?.texture?.src ?? null, added: false };

    if (placeholder) {
      entry.reason = img && !/^icons\/svg\//.test(img) && !exists
        ? 'файл исходного изображения отсутствует'
        : 'в мире не было портрета (заглушка Foundry)';
      portraits.push(entry);
      continue;
    }
    if (NO_PORTRAIT.has(doc._id)) {
      entry.reason = NO_PORTRAIT.get(doc._id);
      portraits.push(entry);
      continue;
    }
    if (variants.some(v => v.imgSrc === img)) {
      entry.reason = 'вариант с этим изображением уже есть';
      portraits.push(entry);
      continue;
    }

    variants.push({ imgSrc: img, names: [doc.prototypeToken?.name || doc.name] });
    doc.flags['token-variants'].variants = variants;
    b.put(k, Buffer.from(JSON.stringify(doc), 'utf8'));
    entry.added = true;
    entry.variants = variants.length;
    portraits.push(entry);
  }
  await b.write();
});
const added = portraits.filter(p => p.added);
console.log('actors with top-down tokens', portraits.length, '| portrait variants added', added.length);

// ---------------------------------------------------------------- empty scene folders
const sceneFolders = [];
const removedFolders = [];
await withDb(path.join(BUILD, 'data/scenes'), async (db) => {
  for await (const [k, v] of db.iterator()) {
    if (!/^!scenes![^.]+$/.test(k.toString('utf8'))) continue;
    const doc = JSON.parse(v.toString('utf8'));
    if (doc.folder) sceneFolders.push(doc.folder);
  }
});
const used = new Set(sceneFolders);
await withDb(path.join(BUILD, 'data/folders'), async (db) => {
  const all = [];
  for await (const [k, v] of db.iterator()) all.push([k, JSON.parse(v.toString('utf8'))]);
  const live = new Set(all.map(([, d]) => d._id));
  const b = db.batch();
  for (const [k, doc] of all) {
    if (doc.type !== 'Scene') continue;
    if (used.has(doc._id)) continue;
    if (all.some(([, other]) => other.parent === doc._id && live.has(other._id))) continue;
    b.del(k);
    live.delete(doc._id);
    removedFolders.push({ id: doc._id, name: doc.name });
  }
  await b.write();
});
console.log('empty scene folders removed', removedFolders.length, removedFolders.map(f => f.name).join(', '));

// ---------------------------------------------------------------- world descriptor
const descPath = path.join(BUILD, 'world.json');
const desc = JSON.parse(fs.readFileSync(descPath, 'utf8'));
if (desc.id !== WORLD_ID) fail('unexpected world id');
if (desc.version !== '3.0.0') fail(`expected 3.0.0, found ${desc.version}`);
desc.version = VERSION;
fs.writeFileSync(descPath, JSON.stringify(desc, null, 2) + '\n');

const releaseManifest = { ...desc };
delete releaseManifest.lastPlayed;
delete releaseManifest.playtime;
releaseManifest.type = 'world';
releaseManifest.manifest = 'https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases/latest/download/world.json';
releaseManifest.download = 'https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases/latest/download/world.zip';

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'world.json'), JSON.stringify(releaseManifest, null, 2) + '\n');
for (const f of ['module.json', 'fxmaster.json', 'fxmaster-5.0.1.zip']) {
  fs.copyFileSync(path.join(OLD_DIST, f), path.join(OUT, f));
}

// ---------------------------------------------------------------- invariants + archive
const check = { scenes: 0, tokens: 0, actors: 0, withVariants: 0, variantRefs: 0, sceneFolders: 0, emptySceneFolders: 0 };
const badVariants = [];
const addedIds = new Set(added.map(a => a.id));
const beforeMain = new Map();
await withDb(path.join(SNAPSHOT, 'actors'), async (db) => {
  for await (const [k, v] of db.iterator()) {
    if (!/^!actors![^.]+$/.test(k.toString('utf8'))) continue;
    const doc = JSON.parse(v.toString('utf8'));
    beforeMain.set(doc._id, {
      main: doc.prototypeToken?.texture?.src ?? null,
      img: doc.img ?? null,
      variants: (doc.flags?.['token-variants']?.variants ?? []).map(x => x.imgSrc),
    });
  }
});
await withDb(path.join(BUILD, 'data/scenes'), async (db) => {
  for await (const [k, v] of db.iterator()) {
    const key = k.toString('utf8');
    if (/^!scenes![^.]+$/.test(key)) check.scenes++;
    if (/^!scenes\.tokens!/.test(key)) check.tokens++;
  }
});
await withDb(path.join(BUILD, 'data/actors'), async (db) => {
  for await (const [k, v] of db.iterator()) {
    if (!/^!actors![^.]+$/.test(k.toString('utf8'))) continue;
    const doc = JSON.parse(v.toString('utf8'));
    check.actors++;
    const variants = doc.flags?.['token-variants']?.variants ?? [];
    const was = beforeMain.get(doc._id);
    if (!was) fail(`actor ${doc.name} is not in the 3.0.0 snapshot`);
    if ((doc.prototypeToken?.texture?.src ?? null) !== was.main) badVariants.push(`${doc.name}: main token changed`);
    if ((doc.img ?? null) !== was.img) badVariants.push(`${doc.name}: portrait field changed`);
    const kept = variants.slice(0, was.variants.length).map(x => x.imgSrc);
    if (JSON.stringify(kept) !== JSON.stringify(was.variants)) badVariants.push(`${doc.name}: existing variants rewritten`);
    if (variants.length) check.withVariants++;
    check.variantRefs += variants.length;
    if (addedIds.has(doc._id) && variants.length < 2) badVariants.push(`${doc.name}: variants ${variants.length}`);
    for (const va of variants) {
      const f = resolveAsset(va.imgSrc);
      if (f && !fs.existsSync(f)) badVariants.push(`${doc.name}: ${va.imgSrc}`);
    }
  }
});
await withDb(path.join(BUILD, 'data/folders'), async (db) => {
  const all = [];
  for await (const [, v] of db.iterator()) all.push(JSON.parse(v.toString('utf8')));
  const ids = new Set(all.map(d => d._id));
  for (const s of used) if (!ids.has(s)) fail(`scene points at deleted folder ${s}`);
  for (const d of all) {
    if (d.type !== 'Scene') continue;
    check.sceneFolders++;
    const kids = all.some(o => o.parent === d._id);
    if (!used.has(d._id) && !kids) check.emptySceneFolders++;
  }
});
if (check.emptySceneFolders !== 0) fail(`empty scene folders left: ${check.emptySceneFolders}`);
if (check.scenes !== 12) fail(`scene count changed: ${check.scenes}`);
if (check.actors !== 183) fail(`actor count changed: ${check.actors}`);
if (check.tokens !== 18) fail(`placed token count changed: ${check.tokens}`);
if (badVariants.length) fail(`bad variants: ${badVariants.slice(0, 5).join(' | ')}`);

fs.rmSync(path.join(OUT, 'world.zip'), { force: true });
const zip = makeZip(path.join(OUT, 'world.zip'), BUILD);

const report = {
  version: VERSION,
  actors: check.actors,
  retokened: portraits.length,
  portraitVariantsAdded: added.length,
  withoutPortrait: portraits.filter(p => !p.added).length,
  actorsWithVariants: check.withVariants,
  variantRefs: check.variantRefs,
  emptySceneFoldersRemoved: removedFolders.length,
  scenes: check.scenes,
  placedTokens: check.tokens,
  zip,
  sha256: {
    'world.json': sha(fs.readFileSync(path.join(OUT, 'world.json'))),
    'world.zip': sha(fs.readFileSync(path.join(OUT, 'world.zip'))),
  },
};
fs.writeFileSync(path.join(ROOT, 'audit/build-v31.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(ROOT, 'audit/v31-portraits.json'), JSON.stringify({ removedFolders, portraits }, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log('OK');
