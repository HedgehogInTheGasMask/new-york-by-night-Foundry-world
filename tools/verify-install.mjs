// Имитация чистой установки: распаковка архивов в пустой Data и проверка ссылок.
// Группы результата: A — ресурсы в комплекте/системе/ядре, B — сторонние модули, C — отсутствующие файлы.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { ClassicLevel } from 'classic-level';

const ROOT = path.resolve(import.meta.dir, '..');
const SIM = path.join(ROOT, 'audit/sim-data');
const problems = [];

// ---- минимальный распаковщик zip с проверкой CRC
function extract(zipFile, destDir) {
  const buf = fs.readFileSync(zipFile);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  const count = buf.readUInt16LE(eocd + 10);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  let p = cdOffset, extracted = 0;
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const elen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nlen).toString('utf8');
    p += 46 + nlen + elen + clen;
    const target = path.join(destDir, name);
    if (name.endsWith('/')) { fs.mkdirSync(target, { recursive: true }); continue; }
    const lnlen = buf.readUInt16LE(lho + 26);
    const lelen = buf.readUInt16LE(lho + 28);
    const start = lho + 30 + lnlen + lelen;
    const raw = buf.subarray(start, start + csize);
    const data = method === 0 ? raw : zlib.inflateRawSync(raw);
    let c = 0xffffffff;
    for (let k = 0; k < data.length; k++) {
      c ^= data[k];
      for (let b = 0; b < 8; b++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    const got = (c ^ 0xffffffff) >>> 0;
    if (got !== crc) problems.push(`CRC mismatch: ${name}`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
    extracted++;
  }
  return extracted;
}

fs.rmSync(SIM, { recursive: true, force: true });
fs.mkdirSync(path.join(SIM, 'modules'), { recursive: true });
fs.mkdirSync(path.join(SIM, 'worlds'), { recursive: true });

// Foundry strips the single root folder of a package archive; emulate that
const modTmp = path.join(SIM, '_mod');
const nMod = extract(path.join(ROOT, 'dist/goldwater-assets.zip'), modTmp);
fs.renameSync(path.join(modTmp, 'goldwater-assets'), path.join(SIM, 'modules', 'goldwater-assets'));
fs.rmSync(modTmp, { recursive: true, force: true });

const worldDir = path.join(SIM, 'worlds', 'goldwater-cuckold');
const nWorld = extract(path.join(ROOT, 'dist/world.zip'), worldDir);

// ---- манифесты, как их увидит Foundry после установки
const mod = JSON.parse(fs.readFileSync(path.join(SIM, 'modules/goldwater-assets/module.json'), 'utf8'));
if (mod.id !== 'goldwater-assets') problems.push('installed module id wrong');
if (mod.version !== '1.0.0') problems.push('installed module version wrong');
const desc = JSON.parse(fs.readFileSync(path.join(worldDir, 'world.json'), 'utf8'));
if (desc.id !== 'goldwater-cuckold' || desc.system !== 'worldofdarkness') problems.push('installed world id/system wrong');
if (desc.version !== '1.1.0') problems.push('installed world version wrong');
const req = (desc.relationships?.requires || []).find(r => r.id === 'goldwater-assets');
if (!req) problems.push('installed world does not require goldwater-assets');
if (!req?.manifest?.startsWith('https://github.com/')) problems.push('module requirement has no manifest URL');
if (!(desc.relationships?.systems || []).some(s => s.id === 'worldofdarkness')) problems.push('system dependency lost');
// the release manifest and the installed descriptor must agree on everything gameplay-related
const relManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist/world.json'), 'utf8'));
for (const k of ['id', 'title', 'system', 'systemVersion', 'coreVersion', 'packs', 'background']) {
  if (JSON.stringify(relManifest[k]) !== JSON.stringify(desc[k])) problems.push(`release manifest and installed world.json disagree on ${k}`);
}

// ---- ссылки внутри установленного мира
const MEDIA = 'png|jpe?g|webp|gif|svg|avif|bmp|mp4|webm|mp3|ogg|wav|m4a|pdf';
const EXT_RE = new RegExp(`\\.(?:${MEDIA})(?![A-Za-z0-9])`, 'gi');
const decode = (p) => { try { return decodeURIComponent(p); } catch { return p; } };
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/plan.json'), 'utf8'));
const knownBroken = new Set((plan.issues || []).map(i => decode(i.path)));

let refs = 0, resolved = 0, systemRefs = 0;
const unresolved = new Map();      // path -> { docs:Set }
const external = new Map();        // moduleId -> { refs, paths:Set, docs:Set }
const walk = (node, cb) => {
  if (typeof node === 'string') cb(node);
  else if (Array.isArray(node)) node.forEach(n => walk(n, cb));
  else if (node && typeof node === 'object') Object.values(node).forEach(n => walk(n, cb));
};
const collections = [
  ...fs.readdirSync(path.join(worldDir, 'data')).map(c => path.join(worldDir, 'data', c)),
  ...fs.readdirSync(path.join(worldDir, 'packs')).map(p => path.join(worldDir, 'packs', p)),
];
for (const dir of collections) {
  const db = new ClassicLevel(dir, { keyEncoding: 'buffer', valueEncoding: 'buffer', createIfMissing: false });
  await db.open();
  for await (const [, v] of db.iterator()) {
    let doc;
    try { doc = JSON.parse(v.toString('utf8')); } catch { problems.push(`unparsable value in ${path.basename(dir)}`); continue; }
    const docName = doc?.name || '';
    walk(doc, (s) => {
      EXT_RE.lastIndex = 0;
      let m;
      while ((m = EXT_RE.exec(s)) !== null) {
        let start = m.index;
        while (start > 0 && /[A-Za-z0-9_./%+\u0400-\u04FF -]/.test(s[start - 1])) start--;
        const tok = decode(s.slice(start, m.index + m[0].length).trim());
        if (!tok.includes('/')) continue;             // bare names are fragments of longer paths
        if (/^(https?:)?\/\//.test(tok)) continue;   // remote / protocol-relative URLs
        refs++;
        if (tok.startsWith('modules/goldwater-assets/')) {
          if (fs.existsSync(path.join(SIM, tok))) resolved++;
          else { if (!unresolved.has(tok)) unresolved.set(tok, new Set()); unresolved.get(tok).add(docName); }
        } else if (tok.startsWith('systems/') || tok.startsWith('icons/') || tok.startsWith('sounds/')) systemRefs++;
        else if (tok.startsWith('modules/')) {
          const id = tok.split('/')[1];
          if (!external.has(id)) external.set(id, { refs: 0, paths: new Set(), docs: new Set() });
          const e = external.get(id);
          e.refs++; e.paths.add(tok); if (docName) e.docs.add(docName);
        } else {
          if (!unresolved.has(tok)) unresolved.set(tok, new Set());
          unresolved.get(tok).add(docName);
        }
      }
    });
  }
  await db.close();
}

const unexpected = [...unresolved.keys()].filter(p => !knownBroken.has(p));
if (unexpected.length) problems.push(`${unexpected.length} unexpected unresolved refs: ${JSON.stringify(unexpected.slice(0, 6))}`);

// ---- группа B: сверяем, что каждый сторонний модуль задокументирован со способом получения
const externalOut = [...external.entries()]
  .map(([id, e]) => {
    const known = (plan.externalModules || []).find(m => m.id === id);
    return { id, refs: e.refs, paths: e.paths.size, docs: [...e.docs].filter(Boolean), installed: known?.installed ?? null, manifest: known?.manifest ?? null };
  })
  .sort((a, b) => b.refs - a.refs);

const out = {
  moduleArchiveFiles: nMod,
  worldArchiveFiles: nWorld,
  refs: {
    total: refs,
    resolvedInModule: resolved,
    systemOrCore: systemRefs,
    externalModules: externalOut.reduce((a, m) => a + m.refs, 0),
    unresolved: unresolved.size,
  },
  groups: {
    A: { note: 'модуль Goldwater Assets, система World of Darkness, ядро Foundry', refs: resolved + systemRefs },
    B: { note: 'сторонние модули (в комплект не входят)', modules: externalOut },
    C: { note: 'отсутствующие файлы', refs: [...unresolved.entries()].map(([p, d]) => ({ path: p, docs: [...d].filter(Boolean) })) },
  },
  moduleBytes: fs.statSync(path.join(ROOT, 'dist/goldwater-assets.zip')).size,
  worldBytes: fs.statSync(path.join(ROOT, 'dist/world.zip')).size,
  sha256: {
    'goldwater-assets.zip': crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'dist/goldwater-assets.zip'))).digest('hex'),
    'world.zip': crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'dist/world.zip'))).digest('hex'),
    'module.json': crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'dist/module.json'))).digest('hex'),
    'world.json': crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'dist/world.json'))).digest('hex'),
  },
  problems,
};
fs.writeFileSync(path.join(ROOT, 'audit/verify-install.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
fs.rmSync(SIM, { recursive: true, force: true });
if (problems.length) process.exitCode = 1;
