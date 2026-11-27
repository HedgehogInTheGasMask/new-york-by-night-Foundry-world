// Package every installed Tom Cartos Modern add-on as a standalone Foundry module.
//
// LICENCE: Tom Cartos' terms forbid distributing his products. The archives this
// script produces are therefore written to `private/` (git-ignored) and are meant
// only for the owner's own Foundry server. Never publish them.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ClassicLevel } from 'classic-level';
import { makeZip } from './zip.mjs';

const ROOT = path.resolve(import.meta.dir, '..');
const MODULES = process.env.FOUNDRY_MODULES
  || path.join(process.env.LOCALAPPDATA || '', 'FoundryVTT/Data/modules');
const OUT = path.join(ROOT, 'private/tom-cartos');
const BASE_URL = process.env.TOM_CARTOS_BASE_URL || '';
const VERSION_SUFFIX = process.env.TOM_CARTOS_VERSION_SUFFIX || '';

const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const isTC = (m) => /tom[- ]?cartos|^tomcartos|^tc-modern/i.test(m.id || '')
  || /tom\s*cartos/i.test(m.title || '')
  || /tomcartos/i.test(JSON.stringify(m.authors || []));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const index = [];
const seenIds = new Set();
for (const dirName of fs.readdirSync(MODULES).sort()) {
  const src = path.join(MODULES, dirName);
  if (!fs.statSync(src).isDirectory()) continue;
  const manifestPath = path.join(src, 'module.json');
  if (!fs.existsSync(manifestPath)) continue;
  const original = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!isTC(original)) continue;
  const id = original.id;
  if (!id) throw new Error(`${dirName}: module.json without id`);
  if (seenIds.has(id)) throw new Error(`duplicate module id ${id}`);
  seenIds.add(id);

  // Foundry 9/10-era packs ship NeDB files (`packs/x.db`); Foundry 12 only reads the
  // LevelDB directory of the same name, which exists next to the old file. Point the
  // manifest at the directory, otherwise the compendium is empty in 12.331.
  const packs = [];
  for (const p of original.packs || []) {
    let relPath = p.path;
    let dir = path.join(src, p.path);
    if (p.path.endsWith('.db') || !fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
      const candidate = path.join(src, p.path.replace(/\.db$/, ''));
      if (fs.statSync(candidate, { throwIfNoEntry: false })?.isDirectory()
        && fs.existsSync(path.join(candidate, 'CURRENT'))) {
        relPath = path.relative(src, candidate).split(path.sep).join('/');
        dir = candidate;
      }
    }
    let docs = 0, entries = 0;
    if (fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
      const db = new ClassicLevel(dir, { keyEncoding: 'buffer', valueEncoding: 'buffer', createIfMissing: false });
      await db.open();
      const top = p.type === 'Scene' ? /^!scenes![^.]+$/ : p.type === 'JournalEntry' ? /^!journal![^.]+$/ : null;
      for await (const [k, v] of db.iterator()) {
        entries++;
        if (top?.test(k.toString('utf8'))) { try { JSON.parse(v.toString('utf8')); docs++; } catch { /* skip */ } }
      }
      await db.close();
    }
    packs.push({ name: p.name, type: p.type, label: p.label, path: relPath, entries, documents: docs });
  }

  const version = original.version + VERSION_SUFFIX;
  const packDir = path.join(OUT, id);
  fs.mkdirSync(packDir, { recursive: true });
  const dropNeDb = new Set(packs.filter(p => !p.path.endsWith('.db')).map(p => p.path + '.db'));
  const packDirs = new Set(packs.map(p => p.path));
  fs.cpSync(src, packDir, {
    recursive: true,
    filter: (p) => {
      const base = path.basename(p);
      if (base === 'LOCK' || base === 'LOG' || base === 'LOG.old') return false;
      const rel = path.relative(src, p).split(path.sep).join('/');
      if (dropNeDb.has(rel)) return false;
      // keep every pack dir a manifest references, plus everything outside packs/
      if (rel === 'packs') return true;
      if (rel.startsWith('packs/')) {
        return [...packDirs].some(d => rel === d || d.startsWith(rel + '/') || rel.startsWith(d + '/'));
      }
      return true;
    },
  });

  const manifest = {
    id,
    title: original.title,
    description: original.description,
    version,
    compatibility: { minimum: '12', verified: '12.331' },
    authors: original.authors,
    packs: (original.packs || []).map((p, i) => ({ ...p, path: packs[i].path })),
    url: 'https://www.tomcartos.com',
    license: 'Tom Cartos Modern. Приобретено для личного использования; распространение запрещено условиями автора.',
    ...(BASE_URL ? {
      manifest: `${BASE_URL.replace(/\/$/, '')}/${id}/module.json`,
      download: `${BASE_URL.replace(/\/$/, '')}/${id}/${id}-${version}.zip`,
    } : {}),
    flags: { 'tom-cartos-private': { originalVersion: original.version, packagedBy: 'goldwater-cuckold/tools/package-tom-cartos.mjs' } },
  };
  fs.writeFileSync(path.join(packDir, 'module.json'), JSON.stringify(manifest, null, 2) + '\n');

  const zipPath = path.join(OUT, `${id}-${version}.zip`);
  const zip = makeZip(zipPath, packDir, { prefix: id });
  const files = (function count(d) {
    let n = 0;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) n += e.isDirectory() ? count(path.join(d, e.name)) : 1;
    return n;
  })(packDir);

  index.push({
    id, title: original.title, version, originalVersion: original.version,
    originalCompatibility: original.compatibility,
    scenes: packs.filter(p => p.type === 'Scene').reduce((a, p) => a + p.documents, 0),
    journals: packs.filter(p => p.type === 'JournalEntry').reduce((a, p) => a + p.documents, 0),
    packs, files, zip: path.basename(zipPath), zipBytes: zip.bytes, sha256: sha(zipPath),
    manifest: BASE_URL ? `${BASE_URL.replace(/\/$/, '')}/${id}/module.json` : null,
  });
  console.log(`${id} v${version}: ${files} files, ${(zip.bytes / 1048576).toFixed(1)} MiB, scenes ${index.at(-1).scenes}`);
}

fs.writeFileSync(path.join(OUT, 'INDEX.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  license: 'Tom Cartos Modern content is licensed to the purchaser only. Not for redistribution.',
  baseUrl: BASE_URL || null,
  modules: index,
}, null, 2));
console.log(`packaged ${index.length} modules into ${OUT}`);
