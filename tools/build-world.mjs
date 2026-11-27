// Build the world archive for release 2.0.0 from a copy of the live world.
// The assets module is unchanged since 1.1.0, so it is not rebuilt here.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ClassicLevel } from 'classic-level';
import { makeZip } from './zip.mjs';

const ROOT = path.resolve(import.meta.dir, '..');
const WORLD_SRC = process.env.WORLD_DIR;
const VERSION = process.env.WORLD_VERSION || '2.0.0';
const MODULE_VERSION = '1.0.0';

const REPO = 'https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world';
const LATEST = `${REPO}/releases/latest/download`;
const PINNED = `${REPO}/releases/download/v1.1.0`;

const BUILD_WORLD = path.join(ROOT, 'build/world');
const OUT = path.join(ROOT, 'dist', `v${VERSION}`);

// Tom Cartos Modern packs installed locally. They are paid content: never shipped,
// never mirrored — only declared as recommendations so the world keeps working
// when the owner installs their own purchased copies.
const TOM_CARTOS = [
  'tom-cartos-modern-city-streets-01',
  'tom-cartos-modern-city-streets-02',
  'tom-cartos-modern-city-streets-03',
  'tom-cartos-modern-downtown-nightclub',
  'tom-cartos-modern-grand-library',
  'tom-cartos-modern-nakatomi-plaza',
  'tom-cartos-modern-penthouse',
  'tom-cartos-modern-prison',
  'tom-cartos-modern-scrapyard',
  'tom-cartos-modern-sewers',
  'tom-cartos-modern-subway-drug-lab',
  'tom-cartos-modern-trainyard',
  'tom-cartos-modern-university-quad',
  'tom-cartos-modern-water-treatment-plant',
  'tomcartosmodern-apartment-block',
  'tomcartosmodern-car-park',
  'tomcartosmodern-high-school',
  'tomcartosmodern-office-block',
  'tomcartosmodern-subway-station',
];

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const fail = (m) => { throw new Error(m); };
const stripLocks = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) stripLocks(p);
    else if (e.name === 'LOCK') fs.rmSync(p, { force: true });
  }
};

// ---------------------------------------------------------------- copy source
fs.rmSync(BUILD_WORLD, { recursive: true, force: true });
fs.mkdirSync(BUILD_WORLD, { recursive: true });
for (const c of fs.readdirSync(path.join(WORLD_SRC, 'data'))) {
  fs.cpSync(path.join(WORLD_SRC, 'data', c), path.join(BUILD_WORLD, 'data', c), { recursive: true });
}
fs.copyFileSync(path.join(WORLD_SRC, 'world.json'), path.join(BUILD_WORLD, 'world.json'));
fs.cpSync(path.join(WORLD_SRC, 'packs'), path.join(BUILD_WORLD, 'packs'), { recursive: true });
if (fs.existsSync(path.join(WORLD_SRC, 'assets'))) {
  fs.cpSync(path.join(WORLD_SRC, 'assets'), path.join(BUILD_WORLD, 'assets'), { recursive: true });
}
fs.mkdirSync(path.join(BUILD_WORLD, 'scenes'), { recursive: true });
stripLocks(path.join(BUILD_WORLD, 'data'));
stripLocks(path.join(BUILD_WORLD, 'packs'));

// ---------------------------------------------------------------- path rewrites
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/plan.json'), 'utf8'));
const seen = new Set();
const repl = plan.rewrites
  .filter(r => !seen.has(r.raw) && seen.add(r.raw))
  .map(r => ({ raw: r.raw, newRaw: r.newRaw }))
  .filter(r => r.raw !== r.newRaw)
  .sort((a, b) => b.raw.length - a.raw.length);
const rewriteText = (s) => {
  let out = s;
  for (const r of repl) if (out.includes(r.raw)) out = out.split(r.raw).join(r.newRaw);
  return out;
};

const onlyDirs = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => path.join(dir, e.name));
const dbDirs = [
  ...onlyDirs(path.join(BUILD_WORLD, 'data')),
  ...onlyDirs(path.join(BUILD_WORLD, 'packs')),
];

let entries = 0, changed = 0, settingDocs = 0;
for (const dir of dbDirs) {
  const db = new ClassicLevel(dir, { keyEncoding: 'buffer', valueEncoding: 'buffer', createIfMissing: false });
  await db.open();
  const batch = db.batch();
  let n = 0, c = 0;
  for await (const [k, v] of db.iterator()) {
    n++;
    const text = v.toString('utf8');
    let next = rewriteText(text);

    // Enable the modules the world actually needs at load time, keep every other
    // user setting untouched.
    if (dir.endsWith(`${path.sep}settings`)) {
      try {
        const doc = JSON.parse(text);
        if (doc?.key === 'core.moduleConfiguration' && typeof doc.value === 'string') {
          const cfg = JSON.parse(doc.value);
          const enable = ['goldwater-assets', 'fxmaster', 'monks-enhanced-journal', ...TOM_CARTOS];
          for (const id of enable) cfg[id] = true;
          doc.value = JSON.stringify(cfg);
          next = JSON.stringify(doc);
          settingDocs++;
        }
      } catch { /* not a settings document we care about */ }
    }

    if (next !== text) { batch.put(k, Buffer.from(next, 'utf8')); c++; }
  }
  if (c) await batch.write();
  entries += n; changed += c;
  await db.close();
}
stripLocks(path.join(BUILD_WORLD, 'data'));
stripLocks(path.join(BUILD_WORLD, 'packs'));
if (settingDocs !== 1) fail(`expected exactly one core.moduleConfiguration document, found ${settingDocs}`);

// ---------------------------------------------------------------- world descriptor
const descPath = path.join(BUILD_WORLD, 'world.json');
const desc = JSON.parse(fs.readFileSync(descPath, 'utf8'));
const frozen = { id: desc.id, system: desc.system, title: desc.title, coreVersion: desc.coreVersion, packs: JSON.stringify(desc.packs) };
if (desc.id !== 'goldwater-cuckold') fail('unexpected world id');
if (desc.coreVersion !== '12.331') fail('unexpected coreVersion');
desc.version = VERSION;
desc.background = rewriteText(desc.background || '');
desc.compatibility = { minimum: '12', verified: '12.331' };
desc.relationships = {
  systems: [{ id: 'worldofdarkness', type: 'system', compatibility: { minimum: '4.2.12', verified: '4.2.12' } }],
  requires: [
    {
      id: 'goldwater-assets',
      type: 'module',
      manifest: `${LATEST}/module.json`,
      compatibility: { minimum: MODULE_VERSION, verified: MODULE_VERSION },
    },
    {
      id: 'fxmaster',
      type: 'module',
      manifest: `${LATEST}/fxmaster.json`,
      compatibility: { minimum: '5.0.1', maximum: '5.0.1' },
    },
  ],
  recommends: [
    {
      id: 'monks-enhanced-journal',
      type: 'module',
      // pinned to the last release built for Foundry 12: the current /latest/ manifest is 14.x
      manifest: 'https://raw.githubusercontent.com/ironmonk88/monks-enhanced-journal/12.02/module.json',
      compatibility: { minimum: '12', maximum: '12.99' },
      reason: 'Иконки страниц журналов Monk\'s Enhanced Journal.',
    },
    ...TOM_CARTOS.map(id => ({
      id,
      type: 'module',
      reason: 'Платный набор Tom Cartos Modern: карты и готовые сцены. Устанавливается из собственной покупки, в релиз не входит.',
    })),
  ],
  conflicts: [],
};
fs.writeFileSync(descPath, JSON.stringify(desc, null, 2) + '\n');
if (desc.id !== frozen.id || desc.system !== frozen.system || desc.title !== frozen.title
  || desc.coreVersion !== frozen.coreVersion || JSON.stringify(desc.packs) !== frozen.packs) {
  fail('world identity changed');
}

// release manifest: everything gameplay-related plus release metadata
const releaseManifest = { ...desc };
delete releaseManifest.lastPlayed;
delete releaseManifest.playtime;
releaseManifest.type = 'world';
releaseManifest.manifest = `${LATEST}/world.json`;
releaseManifest.download = `${LATEST}/world.zip`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'world.json'), JSON.stringify(releaseManifest, null, 2) + '\n');

// ---------------------------------------------------------------- scene invariants
const scenesDir = path.join(BUILD_WORLD, 'data/scenes');
const db = new ClassicLevel(scenesDir, { keyEncoding: 'buffer', valueEncoding: 'buffer', createIfMissing: false });
await db.open();
const stats = { scenes: 0, walls: 0, doors: 0, secretDoors: 0, lights: 0, tokens: 0, sounds: 0, notes: 0, tiles: 0, drawings: 0 };
const perScene = new Map();
let snow = null;
for await (const [k, v] of db.iterator()) {
  const key = k.toString('utf8');
  const doc = (() => { try { return JSON.parse(v.toString('utf8')); } catch { return null; } })();
  if (!doc) continue;
  let m;
  if ((m = key.match(/^!scenes\.walls!([^.]+)\./))) {
    if (doc.door === 1) stats.doors++;
    else if (doc.door === 2) stats.secretDoors++;
  }
  if (/^!scenes\.(walls|lights|tokens|sounds|notes|tiles|drawings)!/.test(key)) {
    const kind = key.split('.')[1].split('!')[0];
    const sid = key.split('!')[1].split('.')[0];
    if (!perScene.has(sid)) perScene.set(sid, {});
    perScene.get(sid)[kind] = (perScene.get(sid)[kind] || 0) + 1;
    if (kind in stats) stats[kind]++;
  }
  if (/^!scenes![^.]+$/.test(key) && doc._id) {
    stats.scenes++;
    if (doc._id === 'Uicwxtf2pNEmjfaS') snow = doc.flags?.fxmaster ?? null;
  }
}
await db.close();
if (stats.scenes !== 66) fail(`expected 66 scenes, got ${stats.scenes}`);
if (stats.walls < 17000) fail(`wall records missing: ${stats.walls}`);
if (stats.doors < 1200) fail(`door records missing: ${stats.doors}`);
if (stats.lights < 2600) fail(`light records missing: ${stats.lights}`);
const expectSnow = JSON.stringify({
  effects: {
    core_snowstorm: { type: 'snowstorm', options: { scale: 0.3, direction: 90, speed: 0.5, lifetime: 5, density: 0.8, alpha: 1, tint: { apply: false, value: '#ffffff' } } },
    core_clouds: { type: 'clouds', options: { scale: 1.2, direction: 90, speed: 0.6, lifetime: 5, density: 0.099, alpha: 1, tint: { apply: false, value: '#ffffff' } } },
  },
});
if (!snow) fail('scene Uicwxtf2pNEmjfaS lost its fxmaster flags');
const got = JSON.stringify({ effects: snow.effects });
if (got !== expectSnow) fail(`snow/cloud parameters differ: ${got}`);

// ---------------------------------------------------------------- archive
fs.rmSync(path.join(OUT, 'world.zip'), { force: true });
const zip = makeZip(path.join(OUT, 'world.zip'), BUILD_WORLD);
const hash = sha(fs.readFileSync(path.join(OUT, 'world.zip')));

const report = {
  version: VERSION, moduleVersion: MODULE_VERSION,
  entries, rewritten: changed,
  stats, perSceneScenes: perScene.size,
  snow: snow.effects,
  zip,
  sha256: { 'world.json': sha(fs.readFileSync(path.join(OUT, 'world.json'))), 'world.zip': hash },
  recommendations: TOM_CARTOS.length,
};
fs.writeFileSync(path.join(ROOT, 'audit/build-v2.json'), JSON.stringify(report, null, 2));
console.log(`world ${VERSION}: ${entries} entries, ${changed} rewritten`);
console.log('scenes', stats.scenes, 'walls', stats.walls, 'doors', stats.doors, 'secret', stats.secretDoors, 'lights', stats.lights);
console.log('zip', zip.files, 'files', (zip.bytes / 1048576).toFixed(1), 'MiB', hash);
console.log('OK');
