// Verify the built world + module: integrity, references, manifests, rewrite round-trip.
import fs from 'node:fs';
import path from 'node:path';
import { ClassicLevel } from 'classic-level';

const ROOT = path.resolve(import.meta.dir, '..');
const BUILD = path.join(ROOT, 'build');
const MODULE_DIR = path.join(BUILD, 'goldwater-assets');
const WORLD_DIR = path.join(BUILD, 'world');
const SRC_WORLD = path.join(ROOT, 'audit/world-copy');
const MODULE_ID = 'goldwater-assets';
const MODULE_VERSION = '1.0.0';
const WORLD_VERSION = '1.1.0';
const MANIFEST_BASE = 'https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases/latest/download';

const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/plan.json'), 'utf8'));
const problems = [];
const info = {};

const decode = (p) => {
  let s = p.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  try { s = decodeURIComponent(s); } catch {}
  return s.replace(/\\/g, '/').replace(/^\.\//, '');
};

async function readAll(dir) {
  const db = new ClassicLevel(dir, { keyEncoding: 'buffer', valueEncoding: 'buffer', createIfMissing: false });
  await db.open();
  const out = [];
  for await (const [k, v] of db.iterator()) out.push([k, v]);
  await db.close();
  return out;
}

// ---- 0. rewrite table + reverse table (for the round-trip proof)
const seen = new Set();
const rewrites = plan.rewrites.filter(r => !seen.has(r.raw) && seen.add(r.raw));
const reverse = new Map();
const ambiguous = new Set();
for (const r of rewrites) {
  if (r.raw === r.newRaw) continue;
  if (reverse.has(r.newRaw) && reverse.get(r.newRaw) !== r.raw) ambiguous.add(r.newRaw);
  else reverse.set(r.newRaw, r.raw);
}
const revSorted = [...reverse.entries()].sort((a, b) => b[0].length - a[0].length);
const reverseText = (s) => {
  let out = s;
  for (const [nw, raw] of revSorted) if (out.includes(nw)) out = out.split(nw).join(raw);
  return out;
};
info.rewrites = { rules: rewrites.length, transformed: rewrites.filter(r => r.raw !== r.newRaw).length, ambiguousTargets: ambiguous.size };

// ---- 1. LevelDB integrity, document counts and a byte-level round-trip against the source world
const collections = fs.readdirSync(path.join(WORLD_DIR, 'data'));
let totalEntries = 0, totalDocs = 0, changedValues = 0, roundTripFailures = 0, ambiguousSkips = 0;
const perColl = {};
async function verifyCollection(label, builtDir, srcDir, isPack = false) {
  const built = await readAll(builtDir);
  const src = await readAll(srcDir);
  const srcMap = new Map(src.map(([k, v]) => [Buffer.from(k).toString('hex'), v]));
  let parseErrors = 0, docs = 0, changed = 0, rtFail = 0, amb = 0, lost = 0;
  for (const [k, v] of built) {
    const text = v.toString('utf8');
    const folderEntry = isPack && String(k).includes('!folders!');
    if (!folderEntry) {
      try { JSON.parse(text); docs++; } catch { parseErrors++; }
    }
    const before = srcMap.get(Buffer.from(k).toString('hex'));
    if (!before) { lost++; continue; }
    if (!before.equals(v)) {
      changed++;
      const hasAmbiguous = [...ambiguous].some(nw => text.includes(nw));
      if (hasAmbiguous) amb++;
      else if (reverseText(text) !== before.toString('utf8')) rtFail++;
    }
  }
  perColl[label] = { built: built.length, source: src.length, documents: docs, parseErrors, changed, roundTripFailures: rtFail, keysLost: lost };
  if (built.length !== src.length) problems.push(`entry count changed in ${label}: ${src.length} -> ${built.length}`);
  if (parseErrors) problems.push(`${parseErrors} unparsable values in ${label}`);
  if (rtFail) problems.push(`${rtFail} values in ${label} changed beyond the path rewrites`);
  if (lost) problems.push(`${lost} source keys missing from ${label}`);
  totalEntries += built.length; totalDocs += docs; changedValues += changed;
  roundTripFailures += rtFail; ambiguousSkips += amb;
}
for (const c of collections) await verifyCollection(`data/${c}`, path.join(WORLD_DIR, 'data', c), path.join(SRC_WORLD, 'data', c));
const packs = fs.readdirSync(path.join(WORLD_DIR, 'packs'));
for (const p of packs) await verifyCollection(`packs/${p}`, path.join(WORLD_DIR, 'packs', p), path.join(SRC_WORLD, 'packs', p), true);

// source key sets must be complete in both directions
for (const c of collections) {
  const built = new Set((await readAll(path.join(WORLD_DIR, 'data', c))).map(([k]) => Buffer.from(k).toString('hex')));
  for (const [k] of await readAll(path.join(SRC_WORLD, 'data', c))) {
    if (!built.has(Buffer.from(k).toString('hex'))) problems.push(`data/${c}: new key not in source`);
  }
}

info.collections = perColl;
info.totalEntries = totalEntries;
info.totalDocuments = totalDocs;
info.changedValues = changedValues;
info.roundTripFailures = roundTripFailures;
info.roundTripSkippedAmbiguous = ambiguousSkips;

// ---- 2. every reference in the rebuilt world must resolve
const MEDIA = 'png|jpe?g|webp|gif|svg|avif|bmp|tiff?|mp3|ogg|oga|wav|m4a|flac|aac|opus|mp4|webm|ogv|mov|m4v|pdf|ttf|otf|woff2?';
const EXT_RE = new RegExp(`\\.(?:${MEDIA})(?![A-Za-z0-9])`, 'gi');
const PATHCH = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_./\\%+~@$&\'!(),;=[]{}#:?*-');
const isPathChar = (c) => PATHCH.has(c) || (c >= '\u0400' && c <= '\u04FF');
const WHOLE_RE = new RegExp(`^.{1,400}\\.(?:${MEDIA})$`, 'i');

const refs = [];
function tokensFromString(s) {
  const found = new Set();
  const t = s.trim();
  if (WHOLE_RE.test(t) && !t.includes('\n')) found.add(t);
  EXT_RE.lastIndex = 0;
  let m;
  while ((m = EXT_RE.exec(s)) !== null) {
    const end = m.index + m[0].length;
    let start = m.index;
    while (start > 0 && end - start < 600 && isPathChar(s[start - 1])) start--;
    found.add(s.slice(start, end));
  }
  for (const mm of s.matchAll(/(?:src|href)\s*=\s*["']([^"']{1,300})["']/gi)) found.add(mm[1]);
  return [...found];
}
function walkJSON(node, out, jpath) {
  if (typeof node === 'string') out.push({ jpath, value: node });
  else if (Array.isArray(node)) node.forEach((v, i) => walkJSON(v, out, `${jpath}[${i}]`));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walkJSON(v, out, jpath ? `${jpath}.${k}` : k);
}

for (const c of collections) {
  for (const [, v] of await readAll(path.join(WORLD_DIR, 'data', c))) {
    const doc = JSON.parse(v.toString('utf8'));
    const strs = [];
    walkJSON(doc, strs, '');
    for (const { jpath, value } of strs) for (const tok of tokensFromString(value)) refs.push({ where: `data/${c}:${jpath}`, tok, doc: doc.name || doc.label || '' });
  }
}
for (const p of packs) {
  for (const [k, v] of await readAll(path.join(WORLD_DIR, 'packs', p))) {
    if (String(k).includes('!folders!')) continue;
    let doc; try { doc = JSON.parse(v.toString('utf8')); } catch { continue; }
    const strs = [];
    walkJSON(doc, strs, '');
    for (const { jpath, value } of strs) for (const tok of tokensFromString(value)) refs.push({ where: `packs/${p}:${jpath}`, tok, doc: doc.name || '' });
  }
}
const desc = JSON.parse(fs.readFileSync(path.join(WORLD_DIR, 'world.json'), 'utf8'));
{
  const strs = []; walkJSON(desc, strs, '');
  for (const { jpath, value } of strs) for (const tok of tokensFromString(value)) refs.push({ where: `world.json:${jpath}`, tok });
}

// drop fragments of longer anchored paths
const anchored = new Set(refs.map(r => r.tok.trim()).filter(t => /^(assets|worlds|systems|modules|icons|ui|sounds|fonts|media)\//.test(t)));
const keptRefs = refs.filter(r => r.tok.trim() && (!/^(assets|worlds|systems|modules|icons|ui|sounds|fonts|media)\//.test(r.tok.trim())
  ? ![...anchored].some(a => a.length > r.tok.trim().length && a.endsWith(r.tok.trim())) : true));

// exact-case inventory of the built module (Foundry on Linux is case-sensitive)
const moduleFileList = [];
(function walkDir(d, rel) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walkDir(path.join(d, e.name), r);
    else moduleFileList.push(r);
  }
})(MODULE_DIR, '');
const moduleExact = new Set(moduleFileList);
const moduleLower = new Map(moduleFileList.map(f => [f.toLowerCase(), f]));

const buckets = { module: [], system: [], core: [], external: [], leftover: [], broken: [], remote: [] };
const caseMismatch = [];
for (const r of keptRefs) {
  const t = decode(r.tok);
  if (/^https?:\/\//i.test(t)) { buckets.remote.push(r); continue; }
  if (t.startsWith(`modules/${MODULE_ID}/`)) {
    const rel = t.slice(`modules/${MODULE_ID}/`.length);
    if (moduleExact.has(rel)) buckets.module.push(r);
    else if (moduleLower.has(rel.toLowerCase())) { caseMismatch.push({ ref: t, actual: moduleLower.get(rel.toLowerCase()) }); buckets.broken.push(r); }
    else buckets.broken.push(r);
  } else if (t.startsWith('systems/') || t.startsWith('icons/') || t.startsWith('ui/') || t.startsWith('sounds/') || t.startsWith('fonts/')) {
    buckets[t.split('/')[0] === 'systems' ? 'system' : 'core'].push(r);
  } else if (t.startsWith('modules/')) buckets.external.push(r);
  else if (t.startsWith('assets/') || t.startsWith('worlds/goldwater-cuckold/')) buckets.leftover.push(r);
  else if (/^[a-zA-Z]:[\\/]/.test(t) || t.startsWith('file://')) buckets.broken.push(r);
  else buckets.broken.push(r); // bare/relative leftovers
}

// unresolved refs that were already broken in the source world are known defects, not build defects
const knownBroken = new Set(plan.issues.filter(i => ['unresolved-bare', 'missing-external-module', 'missing', 'missing-system'].includes(i.cls)).map(i => decode(i.path)));
const knownSet = [...new Set(buckets.broken.filter(r => knownBroken.has(decode(r.tok))).map(r => decode(r.tok)))];
const unknownBroken = [...new Set(buckets.broken.map(r => decode(r.tok)).filter(t => !knownBroken.has(t)))];

info.refs = Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length]));
info.knownBroken = knownSet;
info.caseMismatch = caseMismatch;
if (buckets.leftover.length) problems.push(`${buckets.leftover.length} refs still point at old local folders: ` + JSON.stringify(buckets.leftover.slice(0, 6).map(r => r.tok)));
if (caseMismatch.length) problems.push(`${caseMismatch.length} refs differ from the real file name only by case`);
if (unknownBroken.length) problems.push(`${unknownBroken.length} unexpected unresolved refs: ` + JSON.stringify(unknownBroken.slice(0, 8)));

// ---- 3. module inventory: nothing unused, nothing missing
const expectedModuleFiles = new Set(plan.bundle.map(b => dstRelOf(b.from)));
function dstRelOf(from) { return from.startsWith('worlds/goldwater-cuckold/') ? `world/${from.slice('worlds/goldwater-cuckold/'.length)}` : from; }
const unusedModuleFiles = moduleFileList.filter(f => f !== 'module.json' && !expectedModuleFiles.has(f));
const missingModuleFiles = [...expectedModuleFiles].filter(f => !moduleExact.has(f));
if (unusedModuleFiles.length) problems.push(`${unusedModuleFiles.length} files in the module are not referenced by the plan: ${unusedModuleFiles.slice(0, 5)}`);
if (missingModuleFiles.length) problems.push(`${missingModuleFiles.length} planned module files are missing from the build tree`);
info.moduleFiles = moduleFileList.filter(f => f !== 'module.json').length;
info.moduleBytes = moduleFileList.reduce((a, f) => a + (f === 'module.json' ? 0 : fs.statSync(path.join(MODULE_DIR, f)).size), 0);
info.unusedModuleFiles = unusedModuleFiles.length;

// ---- 4. manifests
const mod = JSON.parse(fs.readFileSync(path.join(MODULE_DIR, 'module.json'), 'utf8'));
const modCopy = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist/module.json'), 'utf8'));
const rel = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist/world.json'), 'utf8'));
if (mod.id !== MODULE_ID) problems.push('module id mismatch');
if (mod.title !== 'Goldwater Assets') problems.push('module title changed');
if (JSON.stringify(mod) !== JSON.stringify(modCopy)) problems.push('dist/module.json differs from the module tree manifest');
if (fs.existsSync(path.join(ROOT, 'module/module.json'))) {
  const modRepo = JSON.parse(fs.readFileSync(path.join(ROOT, 'module/module.json'), 'utf8'));
  if (JSON.stringify(mod) !== JSON.stringify(modRepo)) problems.push('module/module.json is out of sync');
}
if (mod.version !== MODULE_VERSION) problems.push(`module version is ${mod.version}, expected ${MODULE_VERSION}`);
if (!mod.manifest?.endsWith('/module.json')) problems.push('module manifest url does not end with /module.json');
if (!mod.download?.endsWith('/goldwater-assets.zip')) problems.push('module download url does not point at goldwater-assets.zip');
if (mod.compatibility?.minimum !== '12') problems.push('module compatibility.minimum is not 12');
if (!mod.relationships?.systems?.some(s => s.id === 'worldofdarkness')) problems.push('module lost the worldofdarkness relationship');
if (rel.id !== 'goldwater-cuckold') problems.push('world id changed');
if (rel.title !== 'Goldwater cuckold') problems.push('world title changed');
if (rel.system !== 'worldofdarkness') problems.push('world system changed');
if (rel.systemVersion !== '4.2.12') problems.push('world systemVersion changed');
if (rel.coreVersion !== '12.331') problems.push('world coreVersion changed');
if (rel.version !== WORLD_VERSION) problems.push(`world version is ${rel.version}, expected ${WORLD_VERSION}`);
if (!rel.manifest?.endsWith('/world.json')) problems.push('world manifest url does not end with /world.json');
if (!rel.download?.endsWith('/world.zip')) problems.push('world download url does not point at world.zip');
if (rel.manifest !== `${MANIFEST_BASE}/world.json`) problems.push('world manifest url changed');
if (mod.manifest !== `${MANIFEST_BASE}/module.json`) problems.push('module manifest url changed');
const allowedRel = new Set(['systems', 'requires', 'recommends', 'conflicts']);
for (const k of Object.keys(rel.relationships || {})) if (!allowedRel.has(k)) problems.push(`unknown relationships key ${k}`);
const requires = (rel.relationships?.requires || []).map(r => r.id);
if (!requires.includes(MODULE_ID)) problems.push('world manifest does not require the module');
if (!(rel.relationships?.systems || []).some(s => s.id === 'worldofdarkness')) problems.push('world manifest lost the system dependency');
const reqEntry = (rel.relationships?.requires || []).find(r => r.id === MODULE_ID);
if (!reqEntry?.manifest?.endsWith('/module.json')) problems.push('module requirement has no manifest url');
if (reqEntry?.compatibility?.minimum !== MODULE_VERSION) problems.push('module requirement minimum version mismatch');
if (desc.id !== 'goldwater-cuckold' || desc.system !== 'worldofdarkness') problems.push('world.json descriptor id/system changed');
if (desc.version !== WORLD_VERSION) problems.push('world descriptor version not bumped');
if (desc.title !== 'Goldwater cuckold') problems.push('world descriptor title changed');

// release manifest must carry everything the descriptor has (Foundry may keep either file)
for (const k of Object.keys(desc)) {
  if (['lastPlayed', 'playtime'].includes(k)) continue;
  if (rel[k] === undefined) problems.push(`release manifest is missing "${k}" from the world descriptor`);
}
if (rel.background !== desc.background) problems.push('release manifest background differs from descriptor');
if (JSON.stringify(rel.packs) !== JSON.stringify(desc.packs)) problems.push('release manifest packs differ from descriptor');
for (const p of desc.packs || []) {
  if (!fs.existsSync(path.join(WORLD_DIR, p.path))) problems.push(`pack ${p.name} path missing: ${p.path}`);
}

// ---- 5. external modules: who is needed, and is that documented
const externalModules = plan.externalModules || [];
const documented = fs.existsSync(path.join(ROOT, 'docs/ASSETS-REPORT.md'))
  ? fs.readFileSync(path.join(ROOT, 'docs/ASSETS-REPORT.md'), 'utf8') : '';
const undocumented = externalModules.filter(m => !documented.includes(m.id)).map(m => m.id);
if (undocumented.length) problems.push(`external modules missing from the report: ${undocumented.join(', ')}`);
info.externalModules = externalModules.map(m => ({ id: m.id, refs: m.refs, paths: m.paths.length, missingPaths: m.missingPaths.length, installed: m.installed, manifest: m.manifest }));
info.externalRefs = buckets.external.length;

info.problems = problems;
fs.writeFileSync(path.join(ROOT, 'audit/verify.json'), JSON.stringify(info, null, 2));
console.log(JSON.stringify({
  refs: info.refs, collections: Object.keys(info.collections).length, totalEntries, totalDocs,
  changedValues, roundTripFailures, moduleFiles: info.moduleFiles, unusedModuleFiles: unusedModuleFiles.length,
  knownBroken, problems,
}, null, 2));
if (problems.length) process.exitCode = 1;
