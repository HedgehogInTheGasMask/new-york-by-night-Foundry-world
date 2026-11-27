// Build Goldwater Assets module + patched world from the audit plan.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ClassicLevel } from 'classic-level';

const ROOT = path.resolve(import.meta.dir, '..');
const DATA = process.env.FOUNDRY_DATA;
const WORLD_SRC = process.env.WORLD_DIR;

const MODULE_ID = 'goldwater-assets';
const MODULE_VERSION = '1.0.0';
const WORLD_VERSION = '1.1.0';
const REPO = 'https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world';
const MANIFEST_BASE = `${REPO}/releases/latest/download`;

const BUILD = path.join(ROOT, 'build');
const DIST = path.join(ROOT, 'dist');
const MODULE_DIR = path.join(BUILD, MODULE_ID);
const WORLD_DIR = path.join(BUILD, 'world');

const log = (...a) => console.log(...a);
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/plan.json'), 'utf8'));
const report = { module: {}, world: {}, rewrites: {}, checks: [] };
const fail = (msg) => { console.error('FAIL:', msg); process.exitCode = 1; throw new Error(msg); };

// ---------------------------------------------------------------- module tree
fs.rmSync(MODULE_DIR, { recursive: true, force: true });
fs.mkdirSync(MODULE_DIR, { recursive: true });

// mirror the Foundry data tree inside the module: assets/... stays assets/...,
// the world's own folders go under world/...
const dstRelOf = (from) => from.startsWith('worlds/goldwater-cuckold/')
  ? `world/${from.slice('worlds/goldwater-cuckold/'.length)}`
  : from;

let copied = 0, copiedBytes = 0;
const hashProblems = [];
const destSeen = new Map();
for (const b of plan.bundle) {
  const src = path.join(DATA, b.from);
  const dst = path.join(MODULE_DIR, dstRelOf(b.from));
  const key = dst.toLowerCase();
  if (destSeen.has(key) && destSeen.get(key) !== b.from) fail(`destination collision ${dst}`);
  destSeen.set(key, b.from);
  if (!fs.existsSync(src)) fail(`missing source ${src}`);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  const a = sha(fs.readFileSync(src));
  const c = sha(fs.readFileSync(dst));
  if (a !== c) hashProblems.push(b.from);
  copied++; copiedBytes += fs.statSync(dst).size;
}
log(`module: copied ${copied} files, ${(copiedBytes / 1048576).toFixed(1)} MiB`);
if (hashProblems.length) fail(`hash mismatch for ${hashProblems.length} files: ${hashProblems.slice(0, 5)}`);
report.module.files = copied;
report.module.bytes = copiedBytes;

const moduleManifest = {
  id: MODULE_ID,
  title: 'Goldwater Assets',
  description: 'Графические и медиаресурсы игрового мира «Goldwater cuckold»: портреты, токены, карты, изображения журналов, музыка и видео. Модуль обязателен для мира goldwater-cuckold.',
  version: MODULE_VERSION,
  authors: [{ name: 'HedgehogInTheGasMask', url: REPO }],
  url: REPO,
  manifest: `${MANIFEST_BASE}/module.json`,
  download: `${MANIFEST_BASE}/goldwater-assets.zip`,
  license: 'Все права на исходные материалы принадлежат их авторам.',
  readme: `${REPO}#readme`,
  compatibility: { minimum: '12', verified: '12.331' },
  relationships: {
    systems: [{ id: 'worldofdarkness', type: 'system', compatibility: { minimum: '4.2.12', verified: '4.2.12' } }],
  },
  esmodules: [],
  styles: [],
  languages: [],
  packs: [],
  socket: false,
  flags: {},
};
const moduleManifestText = JSON.stringify(moduleManifest, null, 2) + '\n';
fs.writeFileSync(path.join(MODULE_DIR, 'module.json'), moduleManifestText);
fs.writeFileSync(path.join(DIST, 'module.json'), moduleManifestText);
fs.writeFileSync(path.join(ROOT, 'module/module.json'), moduleManifestText);

// ---------------------------------------------------------------- world tree
fs.rmSync(WORLD_DIR, { recursive: true, force: true });
fs.mkdirSync(WORLD_DIR, { recursive: true });

// copy world data exactly (LevelDB dirs), then rewrite values in place
const colls = fs.readdirSync(path.join(WORLD_SRC, 'data'));
for (const c of colls) {
  fs.cpSync(path.join(WORLD_SRC, 'data', c), path.join(WORLD_DIR, 'data', c), { recursive: true });
}
fs.copyFileSync(path.join(WORLD_SRC, 'world.json'), path.join(WORLD_DIR, 'world.json'));
fs.cpSync(path.join(WORLD_SRC, 'packs'), path.join(WORLD_DIR, 'packs'), { recursive: true });
if (fs.existsSync(path.join(WORLD_SRC, 'assets'))) {
  fs.cpSync(path.join(WORLD_SRC, 'assets'), path.join(WORLD_DIR, 'assets'), { recursive: true });
}
fs.mkdirSync(path.join(WORLD_DIR, 'scenes'), { recursive: true });
// strip stale LevelDB locks so the copies can be opened and are clean for install
const stripLocks = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) stripLocks(p);
    else if (e.name === 'LOCK') fs.rmSync(p, { force: true });
  }
};
stripLocks(path.join(WORLD_DIR, 'data'));
stripLocks(path.join(WORLD_DIR, 'packs'));

// replacement table from the audit plan (longest first so nested names cannot clobber each other).
// The plan already emits Foundry-addressed targets: modules/<id>/<path inside the module>.
const seenRaw = new Set();
const repl = plan.rewrites
  .filter(r => !seenRaw.has(r.raw) && seenRaw.add(r.raw))
  .map(r => ({ raw: r.raw, newRaw: r.newRaw }))
  .filter(r => r.raw !== r.newRaw)
  .sort((a, b) => b.raw.length - a.raw.length);

function rewriteText(s) {
  let out = s;
  for (const r of repl) if (out.includes(r.raw)) out = out.split(r.raw).join(r.newRaw);
  return out;
}

let docsTotal = 0, docsChanged = 0, valuesChanged = 0;
const dbDirs = [];
for (const c of fs.readdirSync(path.join(WORLD_DIR, 'data'))) dbDirs.push(path.join(WORLD_DIR, 'data', c));
for (const p of fs.readdirSync(path.join(WORLD_DIR, 'packs'))) dbDirs.push(path.join(WORLD_DIR, 'packs', p));

for (const dir of dbDirs) {
  const db = new ClassicLevel(dir, { keyEncoding: 'buffer', valueEncoding: 'buffer', createIfMissing: false });
  await db.open();
  const batch = db.batch();
  let changed = 0, seen = 0;
  for await (const [k, v] of db.iterator()) {
    seen++;
    const text = v.toString('utf8');
    const next = rewriteText(text);
    if (next !== text) { batch.put(k, Buffer.from(next, 'utf8')); changed++; }
  }
  if (changed) await batch.write();
  docsTotal += seen; docsChanged += changed; valuesChanged += changed;
  await db.close();
  if (seen) report.rewrites[path.relative(WORLD_DIR, dir).replace(/\\/g, '/')] = { entries: seen, changed };
}
// opening a LevelDB for the rewrite recreates its LOCK file - drop them again before packaging
stripLocks(path.join(WORLD_DIR, 'data'));
stripLocks(path.join(WORLD_DIR, 'packs'));

log(`world: ${docsTotal} entries scanned, ${docsChanged} updated`);
report.world.entries = docsTotal;
report.world.entriesChanged = docsChanged;

// world descriptor (folder manifest) - keep ids and gameplay data, add version + relationships
const descPath = path.join(WORLD_DIR, 'world.json');
const desc = JSON.parse(fs.readFileSync(descPath, 'utf8'));
const idSnapshot = { id: desc.id, system: desc.system, title: desc.title, coreVersion: desc.coreVersion };
desc.version = WORLD_VERSION;
desc.background = rewriteText(desc.background || '');
desc.compatibility = { minimum: '12', verified: '12.331' };
desc.relationships = {
  systems: [{ id: 'worldofdarkness', type: 'system', compatibility: { minimum: '4.2.12', verified: '4.2.12' } }],
  requires: [{
    id: MODULE_ID,
    type: 'module',
    manifest: `${MANIFEST_BASE}/module.json`,
    compatibility: { minimum: MODULE_VERSION, verified: MODULE_VERSION },
  }],
  // free, stable GitHub manifest, verified for V12; only the journal icon flags depend on it,
  // so it is a recommendation and never blocks the world from launching
  recommends: [{
    id: 'monks-enhanced-journal',
    type: 'module',
    manifest: 'https://github.com/ironmonk88/monks-enhanced-journal/releases/latest/download/module.json',
    compatibility: { minimum: '12' },
  }],
  conflicts: [],
};
fs.writeFileSync(descPath, JSON.stringify(desc, null, 2) + '\n');
if (desc.id !== idSnapshot.id || desc.system !== idSnapshot.system) fail('world id/system changed');
if (desc.title !== idSnapshot.title) fail('world title changed');
if (desc.coreVersion !== idSnapshot.coreVersion) fail('world coreVersion changed');

// release manifest = the complete descriptor (background, packs, relationships) + release metadata,
// minus runtime-only fields. Foundry may keep either file as the world descriptor, so both must be usable.
const releaseManifest = { ...desc };
delete releaseManifest.lastPlayed;
delete releaseManifest.playtime;
releaseManifest.type = 'world';
releaseManifest.version = WORLD_VERSION;
releaseManifest.manifest = `${MANIFEST_BASE}/world.json`;
releaseManifest.download = `${MANIFEST_BASE}/world.zip`;
fs.writeFileSync(path.join(DIST, 'world.json'), JSON.stringify(releaseManifest, null, 2) + '\n');

report.build = { moduleVersion: MODULE_VERSION, worldVersion: WORLD_VERSION, moduleBytes: copiedBytes };
fs.writeFileSync(path.join(ROOT, 'audit/build-report.json'), JSON.stringify(report, null, 2));
log('manifest URLs:', moduleManifest.manifest, '|', moduleManifest.download);
log('world version:', releaseManifest.version);
log('OK build tree ready');
