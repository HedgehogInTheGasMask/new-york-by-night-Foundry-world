// Инвентаризация модуля: категории, объём, использование, дубликаты по SHA-256, служебные файлы.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dir, '..');
const MODULE_DIR = path.join(ROOT, 'build/goldwater-assets');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/plan.json'), 'utf8'));
const { refs } = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/references.json'), 'utf8'));

const dstRelOf = (from) => from.startsWith('worlds/goldwater-cuckold/')
  ? `world/${from.slice('worlds/goldwater-cuckold/'.length)}` : from;

// ---- ссылки по пути: какие поля и коллекции на него смотрят
const refsByRaw = new Map();
for (const r of refs) {
  if (!refsByRaw.has(r.raw)) refsByRaw.set(r.raw, []);
  refsByRaw.get(r.raw).push(r);
}

const isImage = /\.(png|jpe?g|webp|gif|svg|avif|bmp|tiff?)$/i;
const isAudio = /\.(mp3|ogg|oga|wav|m4a|flac|aac|opus)$/i;
const isVideo = /\.(mp4|webm|ogv|mov|m4v)$/i;

const ROLE_PRIORITY = ['maps', 'portraits', 'tokens', 'journal', 'thumbs', 'items', 'world', 'other'];
const ROLE_LABEL = {
  maps: 'Карты и фоны сцен',
  portraits: 'Портреты персонажей',
  tokens: 'Токены',
  journal: 'Изображения журналов',
  thumbs: 'Превью сцен',
  items: 'Изображения предметов',
  world: 'Оформление мира',
  other: 'Прочие изображения',
  music: 'Музыка',
  video: 'Видео',
  documents: 'Документы (PDF)',
};

function rolesOf(raw) {
  const list = refsByRaw.get(raw) || [];
  const counts = {};
  for (const r of list) {
    const j = r.jpath || '';
    const col = r.collection || '';
    let role = 'other';
    if (/background/i.test(j)) role = 'maps';
    else if (/token/i.test(j)) role = 'tokens';
    else if (/thumb/i.test(j)) role = 'thumbs';
    else if (/^img$/.test(j) && /(^|:)(actors|characters)$/.test(col)) role = 'portraits';
    else if (/pages?\b/i.test(j) || col.includes('journal')) role = 'journal';
    else if (/^img$/.test(j) && col.includes('items')) role = 'items';
    else if (col === 'world.json') role = 'world';
    counts[role] = (counts[role] || 0) + 1;
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return { primary: 'unknown', all: [] };
  const max = ranked[0][1];
  const tied = ranked.filter(([, n]) => n === max).map(([k]) => k);
  const primary = ROLE_PRIORITY.find(p => tied.includes(p)) || tied[0];
  return { primary, all: Object.keys(counts) };
}

const files = [];
(function walk(d, rel) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) { walk(path.join(d, e.name), r); continue; }
    files.push({ rel: r, bytes: fs.statSync(path.join(d, e.name)).size });
  }
})(MODULE_DIR, '');

const planByDst = new Map(plan.bundle.map(b => [dstRelOf(b.from), b]));

const hashFile = (p) => new Promise((resolve, reject) => {
  const h = crypto.createHash('sha256');
  fs.createReadStream(p).on('data', c => h.update(c)).on('end', () => resolve(h.digest('hex'))).on('error', reject);
});

const categories = {};
const byHash = new Map();
let unused = 0, unusedBytes = 0, totalBytes = 0;
const suspicious = [];
const largest = [];

for (const f of files) {
  if (f.rel === 'module.json') continue;
  totalBytes += f.bytes;
  const b = planByDst.get(f.rel);
  const raw = b?.raw;
  let cat;
  if (isAudio.test(f.rel)) cat = 'music';
  else if (isVideo.test(f.rel)) cat = 'video';
  else if (/\.pdf$/i.test(f.rel)) cat = 'documents';
  else if (isImage.test(f.rel)) cat = b ? rolesOf(raw).primary : 'other';
  else cat = 'other';

  if (!b || !(refsByRaw.get(raw)?.length)) { unused++; unusedBytes += f.bytes; }
  const c = categories[cat] ||= { files: 0, bytes: 0, used: 0, unused: 0, refs: 0 };
  c.files++; c.bytes += f.bytes;
  if (b && refsByRaw.get(raw)?.length) { c.used++; c.refs += refsByRaw.get(raw).length; } else c.unused++;

  if (/\.(psd|xcf|blend|zip|rar|7z|txt|md|db|tmp|bak|log|ini|lnk|swf)$/i.test(f.rel)
    || /(^|\/)(thumbs\.db|desktop\.ini|\.ds_store)$/i.test(f.rel)
    || /~$/.test(f.rel) || /(^|\/)(copy of|backup)/i.test(f.rel)) suspicious.push(f.rel);

  const hash = await hashFile(path.join(MODULE_DIR, f.rel));
  if (!byHash.has(hash)) byHash.set(hash, []);
  byHash.get(hash).push(f.rel);
  largest.push({ rel: f.rel, bytes: f.bytes });
}

const duplicates = [...byHash.entries()]
  .filter(([, v]) => v.length > 1)
  .map(([hash, v]) => ({ hash, files: v, bytesEach: fs.statSync(path.join(MODULE_DIR, v[0])).size }))
  .sort((a, b) => b.bytesEach * (b.files.length - 1) - a.bytesEach * (a.files.length - 1));
const duplicateBytes = duplicates.reduce((a, d) => a + d.bytesEach * (d.files.length - 1), 0);

// ---- дубликаты между модулем и копией внутри world.zip (assets/ страховочная копия)
let worldDup = null;
const worldAssets = path.join(ROOT, 'build/world/assets');
if (fs.existsSync(worldAssets)) {
  const wfiles = [];
  (function walk(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(d, e.name), r);
      else wfiles.push({ rel: r, bytes: fs.statSync(path.join(d, e.name)).size });
    }
  })(worldAssets, '');
  const moduleHashSet = new Set(byHash.keys());
  let same = 0, sameBytes = 0;
  for (const w of wfiles) {
    const h = await hashFile(path.join(worldAssets, w.rel));
    if (moduleHashSet.has(h)) { same++; sameBytes += w.bytes; }
  }
  worldDup = { files: wfiles.length, bytes: wfiles.reduce((a, f) => a + f.bytes, 0), identicalToModule: same, identicalBytes: sameBytes };
}

const totalFiles = files.filter(f => f.rel !== 'module.json').length;
const out = {
  moduleFiles: totalFiles,
  moduleBytes: totalBytes,
  categories: Object.fromEntries(Object.entries(categories)
    .map(([k, v]) => [k, { ...v, label: ROLE_LABEL[k] || k }])
    .sort((a, b) => b[1].bytes - a[1].bytes)),
  unused: { files: unused, bytes: unusedBytes },
  duplicates: { groups: duplicates.length, redundantBytes: duplicateBytes, items: duplicates },
  suspicious,
  largest: largest.sort((a, b) => b.bytes - a.bytes).slice(0, 10),
  worldAssets: worldDup,
};
fs.writeFileSync(path.join(ROOT, 'audit/inventory.json'), JSON.stringify(out, null, 2));

console.log(`files ${totalFiles}, ${(totalBytes / 1048576).toFixed(1)} MiB, unused ${unused}`);
for (const [k, v] of Object.entries(out.categories)) {
  console.log(`${k.padEnd(10)} ${String(v.files).padStart(4)} файлов ${String((v.bytes / 1048576).toFixed(1)).padStart(8)} МиБ  used ${v.used} unused ${v.unused}`);
}
console.log(`duplicates: ${duplicates.length} groups, ${(duplicateBytes / 1048576).toFixed(1)} MiB redundant`);
console.log(`suspicious: ${suspicious.length}`, suspicious.slice(0, 5));
console.log('world dup:', JSON.stringify(worldDup));
