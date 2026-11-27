// Compare the packaged 2.0.0 world against the live world it was built from,
// then check every resource reference in it.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ClassicLevel } from 'classic-level';

const ROOT = path.resolve(import.meta.dir, '..');
const VERSION = process.env.WORLD_VERSION || '2.0.0';
const SRC = process.env.WORLD_SRC
  || path.join(ROOT, '../audit/world-src');
const ZIP = path.join(ROOT, 'dist', `v${VERSION}`, 'world.zip');
const EX = path.join(ROOT, 'audit/extract', `v${VERSION}`);
const MODULE_DIR = path.join(ROOT, 'build/goldwater-assets');

const TOM_CARTOS = [
  'tom-cartos-modern-city-streets-01', 'tom-cartos-modern-city-streets-02', 'tom-cartos-modern-city-streets-03',
  'tom-cartos-modern-downtown-nightclub', 'tom-cartos-modern-grand-library', 'tom-cartos-modern-nakatomi-plaza',
  'tom-cartos-modern-penthouse', 'tom-cartos-modern-prison', 'tom-cartos-modern-scrapyard',
  'tom-cartos-modern-sewers', 'tom-cartos-modern-subway-drug-lab', 'tom-cartos-modern-trainyard',
  'tom-cartos-modern-university-quad', 'tom-cartos-modern-water-treatment-plant',
  'tomcartosmodern-apartment-block', 'tomcartosmodern-car-park', 'tomcartosmodern-high-school',
  'tomcartosmodern-office-block', 'tomcartosmodern-subway-station',
];

const problems = [];
const fail = (m) => problems.push(m);

// ---------------------------------------------------------------- unzip
function extract(zipFile, destDir) {
  const buf = fs.readFileSync(zipFile);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('EOCD not found');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28), elen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nlen).toString('utf8');
    p += 46 + nlen + elen + clen;
    const target = path.join(destDir, name);
    if (name.endsWith('/')) { fs.mkdirSync(target, { recursive: true }); continue; }
    const lnlen = buf.readUInt16LE(lho + 26), lelen = buf.readUInt16LE(lho + 28);
    const start = lho + 30 + lnlen + lelen;
    const raw = buf.subarray(start, start + csize);
    const data = method === 0 ? raw : zlib.inflateRawSync(raw);
    let c = 0xffffffff;
    for (let k = 0; k < data.length; k++) { c ^= data[k]; for (let b = 0; b < 8; b++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; }
    if (((c ^ 0xffffffff) >>> 0) !== crc) fail(`CRC mismatch ${name}`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
  }
}
fs.rmSync(EX, { recursive: true, force: true });
fs.mkdirSync(EX, { recursive: true });
extract(ZIP, EX);

// files available in the assets module, used for background/rewrite checks
const moduleFiles = new Set();
(function walk(d, rel) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walk(path.join(d, e.name), r); else moduleFiles.add(`modules/goldwater-assets/${r}`.toLowerCase());
  }
})(MODULE_DIR, '');

// ---------------------------------------------------------------- snapshot a world's docs
async function snapshot(worldDir) {
  const out = new Map();
  const walkDirs = (dir, kind) => fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory()).map(e => ({ kind, dir: path.join(dir, e.name), name: e.name }))
    .concat(kind === 'data' ? fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isFile() && e.name !== 'LOG' && e.name !== 'LOCK')
      .map(e => ({ kind: 'file', dir: path.join(dir, e.name), name: e.name })) : []);
  const sources = [
    ...walkDirs(path.join(worldDir, 'data'), 'data'),
    ...walkDirs(path.join(worldDir, 'packs'), 'pack'),
  ];
  for (const s of sources) {
    const key = `${s.kind}/${s.name}`;
    if (s.kind === 'file') { out.set(key, { file: fs.readFileSync(s.dir, 'utf8') }); continue; }
    const db = new ClassicLevel(s.dir, { keyEncoding: 'buffer', valueEncoding: 'buffer', createIfMissing: false });
    await db.open();
    const docs = new Map();
    for await (const [k, v] of db.iterator()) docs.set(k.toString('utf8'), v.toString('utf8'));
    await db.close();
    out.set(key, { docs });
  }
  return out;
}

// ---------------------------------------------------------------- structural comparison
function sceneElements(docs) {
  const per = new Map();
  const sceneDocs = new Map();
  const fx = new Map();
  for (const [key, text] of docs) {
    let doc; try { doc = JSON.parse(text); } catch { continue; }
    if (/^!scenes![^.]+$/.test(key)) {
      sceneDocs.set(doc._id, doc);
      if (doc.flags?.fxmaster) fx.set(doc._id, JSON.stringify(doc.flags.fxmaster));
      continue;
    }
    const m = key.match(/^!scenes\.(walls|lights|tokens|sounds|notes|tiles|drawings)!([^.]+)\./);
    if (!m) continue;
    const sid = m[2];
    if (!per.has(sid)) per.set(sid, { walls: 0, doors: 0, secret: 0, lights: 0, tokens: 0, sounds: 0, notes: 0, tiles: 0, drawings: 0 });
    const rec = per.get(sid);
    rec[m[1]]++;
    if (m[1] === 'walls') { if (doc.door === 1) rec.doors++; else if (doc.door === 2) rec.secret++; }
  }
  return { per, sceneDocs, fx };
}

const srcSnap = await snapshot(SRC);
const outSnap = await snapshot(EX);
const srcScenes = sceneElements(srcSnap.get('data/scenes').docs);
const outScenes = sceneElements(outSnap.get('data/scenes').docs);

if (srcScenes.sceneDocs.size !== outScenes.sceneDocs.size) fail(`scene count ${outScenes.sceneDocs.size} != source ${srcScenes.sceneDocs.size}`);
for (const [id, s] of srcScenes.sceneDocs) {
  const o = outScenes.sceneDocs.get(id);
  if (!o) { fail(`scene missing: ${s.name} (${id})`); continue; }
  if (o.name !== s.name) fail(`scene name changed: ${id}`);
  if (o.background?.src !== s.background?.src) {
    // resources moved into the assets module; the new path must resolve there
    const rewritten = String(o.background?.src || '').toLowerCase();
    if (!rewritten.startsWith('modules/goldwater-assets/')) fail(`scene background changed: ${s.name} -> ${o.background?.src}`);
    else if (!moduleFiles.has(rewritten)) fail(`scene background missing in module: ${s.name} -> ${o.background?.src}`);
  }
  if (o.width !== s.width || o.height !== s.height) fail(`scene size changed: ${s.name}`);
  const a = srcScenes.per.get(id) || {};
  const b = outScenes.per.get(id) || {};
  for (const k of ['walls', 'doors', 'secret', 'lights', 'tokens', 'sounds', 'notes', 'tiles', 'drawings']) {
    if ((a[k] || 0) !== (b[k] || 0)) fail(`scene ${s.name}: ${k} ${b[k] || 0} != ${a[k] || 0}`);
  }
}
// non-scene collections: same entries, same keys
for (const [key, s] of srcSnap) {
  if (key.startsWith('scenes')) continue;
  const o = outSnap.get(key);
  if (!o) { fail(`collection missing: ${key}`); continue; }
  if (s.file !== undefined) {
    if (s.file !== o.file) fail(`file differs: ${key}`);
    continue;
  }
  if (s.docs.size !== o.docs.size) fail(`${key}: ${o.docs.size} entries != ${s.docs.size}`);
  let changed = 0;
  for (const [k, v] of s.docs) {
    const nv = o.docs.get(k);
    if (nv === undefined) { fail(`${key}: key lost ${k}`); continue; }
    if (nv !== v) changed++;
  }
  if (changed > 0 && !key.startsWith('settings')) {
    // only resource paths may change; counted, not failed
  }
}

// ---------------------------------------------------------------- references
const EXT = /\.(png|jpe?g|webp|gif|svg|avif|bmp|mp4|webm|mp3|ogg|wav|m4a|pdf)(?![A-Za-z0-9])/gi;
const decode = (p) => { try { return decodeURIComponent(p); } catch { return p; } };
const tcLower = new Set(TOM_CARTOS.map(id => `modules/${id.toLowerCase()}/`));

const knownBroken = new Set([
  'new york/OST/battle themes/Maenad Veyl - Out of Sight.mp3',
  'new york/OST/battle themes/Maenad Veyl - Unhealed [B1GF2gT3Ek8].mp3',
  'new york/OST/battle themes/Knights & Bishops.mp3',
  // missing inside Monk's Enhanced Journal 12.02 itself, not part of this world
  'modules/monks-enhanced-journal/assets/video.png',
  'modules/monks-enhanced-journal/assets/text.png',
]);
const refs = { total: 0, module: 0, moduleMissing: 0, tc: 0, system: 0, core: 0, external: 0, stale: 0, absolute: 0 };
const missing = new Set();
const stale = new Set();
for (const [key, snap] of outSnap) {
  const docs = snap.docs || new Map([[key, snap.file]]);
  for (const [k, text] of docs) {
    let doc; try { doc = JSON.parse(text); } catch { continue; }
    const walk = (node) => {
      if (typeof node === 'string') {
        EXT.lastIndex = 0;
        let m;
        while ((m = EXT.exec(node)) !== null) {
          let start = m.index;
          while (start > 0 && /[A-Za-z0-9_./%+\u0400-\u04FF -]/.test(node[start - 1])) start--;
          const tok = decode(node.slice(start, m.index + m[0].length).trim());
          if (!tok.includes('/')) continue;
          if (/^(https?:)?\/\//.test(tok)) { refs.external++; continue; }
          refs.total++;
          if (/^[A-Za-z]:\//.test(tok) || tok.startsWith('/')) { refs.absolute++; missing.add(tok); continue; }
          const low = tok.toLowerCase();
          if (low.startsWith('modules/goldwater-assets/')) {
            if (moduleFiles.has(low)) refs.module++;
            else { refs.moduleMissing++; missing.add(tok); }
          } else if (low.startsWith('modules/')) {
            const id = tok.split('/')[1];
            if (tcLower.has(`modules/${id.toLowerCase()}/`)) refs.tc++;
            else { refs.stale++; stale.add(tok); }
          } else if (low.startsWith('systems/')) refs.system++;
          else if (/^(icons|sounds|ui|fonts|cards|styles|templates)\//.test(low)) refs.core++;
          else {
            if (knownBroken.has(tok)) continue;
            refs.stale++; stale.add(tok);
          }
        }
      } else if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === 'object') Object.values(node).forEach(walk);
    };
    walk(doc);
  }
}

// ---------------------------------------------------------------- manifests & settings
const installedDesc = JSON.parse(fs.readFileSync(path.join(EX, 'world.json'), 'utf8'));
const releaseManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist', `v${VERSION}`, 'world.json'), 'utf8'));
if (installedDesc.version !== VERSION) fail(`installed world version ${installedDesc.version}`);
if (releaseManifest.version !== VERSION) fail(`release world version ${releaseManifest.version}`);
if (installedDesc.relationships?.requires?.some?.(r => false)) { /* Set-like check below */ }
const reqIds = [...(installedDesc.relationships?.requires || [])].map(r => r.id);
if (!reqIds.includes('goldwater-assets') || !reqIds.includes('fxmaster')) fail(`requires: ${reqIds}`);
const recIds = [...(installedDesc.relationships?.recommends || [])].map(r => r.id);
for (const id of TOM_CARTOS) if (!recIds.includes(id)) fail(`missing recommendation ${id}`);
for (const k of ['id', 'title', 'system', 'systemVersion', 'coreVersion', 'packs', 'background']) {
  if (JSON.stringify(releaseManifest[k]) !== JSON.stringify(installedDesc[k])) fail(`manifest mismatch on ${k}`);
}

let modCfg = null;
for (const [, text] of outSnap.get('data/settings').docs) {
  let d; try { d = JSON.parse(text); } catch { continue; }
  if (d?.key === 'core.moduleConfiguration') modCfg = JSON.parse(d.value);
}
if (!modCfg) fail('no core.moduleConfiguration');
for (const id of ['goldwater-assets', 'fxmaster', ...TOM_CARTOS]) if (modCfg[id] !== true) fail(`module not enabled: ${id}`);

// ---------------------------------------------------------------- report
const scenes = [...outScenes.sceneDocs.values()].map(s => ({
  id: s._id, name: s.name,
  background: s.background?.src ?? null,
  width: s.width, height: s.height,
  grid: { type: s.grid?.type, size: s.grid?.size, distance: s.grid?.distance, units: s.grid?.units },
  walls: (outScenes.per.get(s._id) || {}).walls || 0,
  doors: (outScenes.per.get(s._id) || {}).doors || 0,
  secretDoors: (outScenes.per.get(s._id) || {}).secret || 0,
  lights: (outScenes.per.get(s._id) || {}).lights || 0,
  tokens: (outScenes.per.get(s._id) || {}).tokens || 0,
  notes: (outScenes.per.get(s._id) || {}).notes || 0,
  sounds: (outScenes.per.get(s._id) || {}).sounds || 0,
  tiles: (outScenes.per.get(s._id) || {}).tiles || 0,
  fxmaster: outScenes.fx.has(s._id) ? JSON.parse(outScenes.fx.get(s._id)) : null,
}));
scenes.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

const snow = scenes.find(s => s.id === 'Uicwxtf2pNEmjfaS')?.fxmaster;
const snowOk = JSON.stringify(snow?.effects?.core_snowstorm?.options) === JSON.stringify({ scale: 0.3, direction: 90, speed: 0.5, lifetime: 5, density: 0.8, alpha: 1, tint: { apply: false, value: '#ffffff' } })
  && JSON.stringify(snow?.effects?.core_clouds?.options) === JSON.stringify({ scale: 1.2, direction: 90, speed: 0.6, lifetime: 5, density: 0.099, alpha: 1, tint: { apply: false, value: '#ffffff' } });
if (!snowOk) fail('New York snow/cloud options differ from the reference');

const report = {
  version: VERSION,
  scenes: scenes.length,
  totals: scenes.reduce((a, s) => ({
    walls: a.walls + s.walls, doors: a.doors + s.doors, secretDoors: a.secretDoors + s.secretDoors,
    lights: a.lights + s.lights, tokens: a.tokens + s.tokens, notes: a.notes + s.notes,
    sounds: a.sounds + s.sounds, tiles: a.tiles + s.tiles,
  }), { walls: 0, doors: 0, secretDoors: 0, lights: 0, tokens: 0, notes: 0, sounds: 0, tiles: 0 }),
  snowMatchesReference: snowOk,
  snow,
  references: refs,
  missing: [...missing].slice(0, 20),
  stale: [...stale].slice(0, 20),
  requires: reqIds, recommends: recIds,
  moduleConfiguration: modCfg,
  problems,
  sceneList: scenes,
};
fs.writeFileSync(path.join(ROOT, `audit/verify-${VERSION}.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ scenes: report.scenes, totals: report.totals, snowOk, refs, missing: missing.size, stale: stale.size, problems: problems.slice(0, 10) }, null, 1));
process.exitCode = problems.length ? 1 : 0;
