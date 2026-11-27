// Authoritative plan: whole-value refs win; truncated token fragments are dropped.
// Produces audit/plan.json: what to bundle, how to rewrite, and what stays external.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');
const DATA = process.env.FOUNDRY_DATA;
const WORLD = process.env.WORLD_DIR;
const { refs } = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/references.json'), 'utf8'));

const MODULE = 'goldwater-assets';
const WORLD_PREFIX = 'worlds/goldwater-cuckold/';
// build-module-relative destination: the world's own files go under world/, everything else keeps its path
const dstRelOf = (from) => from.startsWith(WORLD_PREFIX) ? `world/${from.slice(WORLD_PREFIX.length)}` : from;

const decode = (p) => {
  let s = p.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  try { s = decodeURIComponent(s); } catch {}
  return s.replace(/\\/g, '/').replace(/^\.\//, '');
};

const ROOT_PREFIX = /^(assets|worlds|systems|modules|icons|ui|sounds|fonts|media)\//;
const anchored = new Set(refs.map(r => r.raw.trim()).filter(v => ROOT_PREFIX.test(v)));
const anchorList = [...anchored];
// drop token fragments that are the tail of a longer anchored path (HTML src broken at a space)
const kept = [];
let dropped = 0;
for (const r of refs) {
  const v = r.raw.trim();
  if (!r.whole && !ROOT_PREFIX.test(v)) {
    let isFrag = false;
    for (const w of anchorList) if (w.length > v.length && w.endsWith(v)) { isFrag = true; break; }
    if (isFrag) { dropped++; continue; }
  }
  kept.push({ ...r, raw: v });
}

const roots = [
  { dir: path.join(DATA, 'assets') },
  { dir: path.join(WORLD, 'assets') },
  { dir: path.join(DATA, 'modules/haunted-estate-battlemap') },
];
const byBasename = new Map();
for (const r of roots) {
  if (!fs.existsSync(r.dir)) continue;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else {
        const rel = path.relative(DATA, p).replace(/\\/g, '/');
        const base = e.name.toLowerCase();
        if (!byBasename.has(base)) byBasename.set(base, []);
        byBasename.get(base).push({ rel, abs: p });
      }
    }
  };
  walk(r.dir);
}

const exists = (rel) => { try { return fs.statSync(path.join(DATA, rel)).isFile(); } catch { return false; } };
const sizeOf = (rel) => { try { return fs.statSync(path.join(DATA, rel)).size; } catch { return 0; } };

const entries = new Map();
for (const r of kept) {
  if (!r.raw) continue;
  if (!entries.has(r.raw)) entries.set(r.raw, { path: r.raw, dec: decode(r.raw), refs: [] });
  entries.get(r.raw).refs.push(r);
}

const plan = { bundle: [], issues: [], rewrites: [], externalModules: [], remoteUrls: [] };
const counts = { totalRefs: kept.length, droppedFragments: dropped, uniquePaths: entries.size, byClass: {} };
const bump = (k) => counts.byClass[k] = (counts.byClass[k] || 0) + 1;

// rewrite target for a bundled source path, as Foundry addresses it from the world
const rewriteTo = (srcRel) => `modules/${MODULE}/${dstRelOf(srcRel)}`;

for (const ent of entries.values()) {
  const raw = ent.path, dec = ent.dec;
  const parts = dec.split('/');
  let cls = null, srcRel = null;
  if (/^https?:\/\//i.test(raw)) cls = 'remote-url';
  else if (/^[a-zA-Z]:[\\/]/.test(raw) || raw.startsWith('file://')) cls = 'absolute-local-path';
  else if (dec.startsWith('assets/')) cls = exists(dec) ? 'bundle-data-assets' : 'missing';
  else if (dec.startsWith(WORLD_PREFIX)) cls = exists(dec) ? 'bundle-world' : 'missing';
  else if (dec.startsWith('worlds/')) cls = 'other-world';
  else if (dec.startsWith('systems/')) cls = exists(dec) ? 'system-provided' : 'missing-system';
  else if (dec.startsWith('modules/') && parts.length === 2) {
    // a file lying directly in Data/modules/ (not inside a package folder)
    cls = exists(dec) ? 'bundle-loose-module-root' : 'missing';
  } else if (dec.startsWith('modules/')) {
    const id = parts[1];
    if (exists(dec)) cls = id === 'haunted-estate-battlemap' ? 'bundle-local-module' : 'external-module';
    else cls = id === 'haunted-estate-battlemap' ? 'missing' : 'missing-external-module';
  } else if (['icons', 'ui', 'sounds', 'fonts'].includes(parts[0])) cls = 'core-provided';
  else {
    // relative path with no known root: try the world's asset folders, then a unique basename match
    const relativeBases = [
      'assets/worldofdarkness/goldwater-cuckold/',
      'assets/_unsorted/',
      `${WORLD_PREFIX}`,
      'assets/worldofdarkness/',
    ];
    const relHit = relativeBases.map(b => b + dec).find(exists);
    const cands = byBasename.get(path.basename(dec).toLowerCase()) || [];
    if (relHit) { cls = 'resolved-relative'; srcRel = relHit; }
    else if (cands.length === 1) { cls = 'resolved-bare'; srcRel = cands[0].rel; }
    else if (cands.length > 1) cls = 'ambiguous-bare';
    else cls = 'unresolved-bare';
  }
  if (!srcRel && cls && cls.startsWith('bundle')) srcRel = dec;
  ent.cls = cls;
  bump(cls);

  const isBundle = cls && cls.startsWith('bundle');
  if (isBundle) {
    const dst = dstRelOf(srcRel);
    const newRaw = rewriteTo(srcRel);
    plan.bundle.push({ from: srcRel, raw, to: dst, cls, bytes: sizeOf(srcRel), refs: ent.refs.length });
    plan.rewrites.push({ raw, dec, srcRel, newRaw });
    ent.dst = dst;
  } else if (cls === 'remote-url') {
    plan.remoteUrls.push(raw);
  } else if (cls === 'external-module' || cls === 'missing-external-module') {
    let e = plan.externalModules.find(m => m.id === parts[1]);
    if (!e) {
      e = { id: parts[1], refs: 0, paths: [], docs: [], collections: [], missingPaths: [] };
      plan.externalModules.push(e);
    }
    e.refs += ent.refs.length;
    e.paths.push(raw);
    for (const r of ent.refs) {
      if (r.docName && !e.docs.includes(r.docName)) e.docs.push(r.docName);
      if (r.collection && !e.collections.includes(r.collection)) e.collections.push(r.collection);
    }
    if (cls === 'missing-external-module') {
      e.missingPaths.push({ path: raw, docs: [...new Set(ent.refs.map(r => r.docName).filter(Boolean))] });
    }
  } else if (!['system-provided', 'core-provided'].includes(cls)) {
    plan.issues.push({
      path: raw, dec, cls, refs: ent.refs.length,
      where: [...new Set(ent.refs.map(r => `${r.collection}:${r.jpath}`))].slice(0, 4),
      docs: [...new Set(ent.refs.map(r => r.docName))].filter(Boolean).slice(0, 5),
    });
  }
}

// installed-package facts for the external modules (read-only, from tools/inspect-local.mjs)
const localFile = path.join(ROOT, 'audit/local-packages.json');
if (fs.existsSync(localFile)) {
  const local = JSON.parse(fs.readFileSync(localFile, 'utf8'));
  const installed = new Map((local.modules || []).map(m => [m.id, m]));
  for (const e of plan.externalModules) {
    const m = installed.get(e.id);
    e.installed = Boolean(m);
    e.title = m?.title || null;
    e.version = m?.version || null;
    e.manifest = m?.manifest || null;
    e.compatibility = m?.compatibility || null;
    e.url = m?.url || null;
    e.authors = m?.authors || null;
  }
  plan.installedModulesNotUsed = (local.modules || [])
    .filter(m => !plan.externalModules.some(e => e.id === m.id))
    .map(m => m.id);
}

// dedupe bundle by destination and detect case-insensitive destination collisions
const byDst = new Map();
for (const b of plan.bundle) {
  const key = b.to.toLowerCase();
  if (!byDst.has(key)) byDst.set(key, []);
  byDst.get(key).push(b);
}
plan.collisions = [...byDst.entries()].filter(([, v]) => v.length > 1).map(([k, v]) => ({ key: k, items: v.map(x => x.from) }));

plan.counts = counts;
plan.bundleFiles = plan.bundle.length;
plan.bundleBytes = plan.bundle.reduce((a, b) => a + b.bytes, 0);
plan.remoteUrls = [...new Set(plan.remoteUrls)].sort();
plan.externalModules.sort((a, b) => b.refs - a.refs);

fs.writeFileSync(path.join(ROOT, 'audit/plan.json'), JSON.stringify(plan, null, 1));
console.log('COUNT', JSON.stringify(counts, null, 2));
console.log(`BUNDLE ${plan.bundleFiles} files, ${(plan.bundleBytes / 1048576).toFixed(1)} MiB`);
console.log('COLLISIONS', JSON.stringify(plan.collisions));
const icls = {};
for (const i of plan.issues) icls[i.cls] = (icls[i.cls] || 0) + 1;
console.log('ISSUES', JSON.stringify(icls, null, 1));
console.log('EXTERNAL', JSON.stringify(plan.externalModules.map(m => ({ id: m.id, refs: m.refs, paths: m.paths.length, missing: m.missingPaths.length, installed: m.installed })), null, 1));
