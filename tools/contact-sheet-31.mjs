// Build a contact sheet of the pre-3.0.0 actor images so they can be visually
// classified as portraits vs. old top-down tokens vs. placeholders.
import fs from 'node:fs';
import path from 'node:path';
const sharp = (await import('sharp').catch(() =>
  import('file:///C:/Users/user1/.bun/install/cache/sharp@0.35.5@@@1/dist/index.cjs'))).default;
import { ClassicLevel } from 'classic-level';

const ROOT = path.resolve(import.meta.dir, '..');
const BUILT = path.join(ROOT, 'build/world-v3');
const BACKUP = 'C:/Users/user1/AppData/Local/FoundryVTT/_parity-backups/2026-11-28/world-goldwater-cuckold';
const MOD = path.join(ROOT, 'build/goldwater-assets');
const DATA = 'C:/Users/user1/AppData/Local/FoundryVTT/Data';

async function readAll(dir) {
  const db = new ClassicLevel(dir, { keyEncoding: 'buffer', valueEncoding: 'buffer' });
  await db.open();
  const out = [];
  try {
    for await (const [k, v] of db.iterator()) out.push([k.toString('utf8'), JSON.parse(v.toString('utf8'))]);
  } finally { await db.close(); }
  return out;
}

const built = (await readAll(path.join(BUILT, 'data/actors')))
  .filter(([k]) => /^!actors![^.]+$/.test(k)).map(([, d]) => d);
const backup = (await readAll(path.join(BACKUP, 'data/actors')))
  .filter(([k]) => /^!actors![^.]+$/.test(k)).map(([, d]) => d);
const bm = new Map(backup.map(d => [d._id, d]));

const resolve = (src) => {
  if (!src) return null;
  const s = decodeURI(src);
  if (s.startsWith('modules/goldwater-assets/')) return path.join(MOD, s.slice('modules/goldwater-assets/'.length));
  if (s.startsWith('assets/')) return path.join(DATA, s);
  return null;
};

const rows = [];
for (const a of built.sort((x, y) => x.name.localeCompare(y.name, 'ru'))) {
  const b = bm.get(a._id);
  const img = b?.img ?? null;
  const oldToken = b?.prototypeToken?.texture?.src ?? null;
  if (!img) continue;
  const file = resolve(img);
  rows.push({
    id: a._id, name: a.name, img, oldToken,
    sameAsOldToken: img === oldToken,
    file,
    exists: !!file && fs.existsSync(file),
  });
}

const unique = [];
const seen = new Set();
for (const r of rows) {
  if (seen.has(r.img)) continue;
  seen.add(r.img);
  unique.push(r);
}

const cell = 150, cols = 9, labelH = 26;
async function sheet(list, outName) {
  const rowCount = Math.ceil(list.length / cols);
  const w = cols * cell, h = rowCount * (cell + labelH);
  const composites = [];
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + labelH);
    if (r.exists) {
      try {
        const buf = await sharp(r.file).resize(cell - 8, cell - 8, { fit: 'contain', background: '#202020' }).png().toBuffer();
        composites.push({ input: buf, left: x + 4, top: y + 4 });
      } catch { /* unreadable image */ }
    }
    const label = sharp(Buffer.from(
      `<svg width="${cell}" height="${labelH}"><rect width="100%" height="100%" fill="#000"/>` +
      `<text x="4" y="18" font-family="Arial" font-size="14" fill="#fff">${i + 1}. ${r.name.slice(0, 16).replace(/[<&>]/g, '')}</text></svg>`))
      .png().toBuffer();
    composites.push({ input: await label, left: x, top: y + cell });
  }
  await sharp({ create: { width: w, height: h, channels: 3, background: '#202020' } })
    .composite(composites).png().toFile(path.join(ROOT, 'audit', outName));
}

const half = Math.ceil(unique.length / 2);
await sheet(unique.slice(0, half), 'v31-portraits-a.png');
if (unique.length > half) await sheet(unique.slice(half), 'v31-portraits-b.png');

fs.writeFileSync(path.join(ROOT, 'audit/v31-portraits.json'), JSON.stringify({
  actors: rows, unique: unique.map((r, i) => ({ index: i + 1, ...r })),
}, null, 2));
console.log('actors with img', rows.length, 'unique images', unique.length, 'missing files', rows.filter(r => !r.exists).length);
console.log('same as old token', rows.filter(r => r.sameAsOldToken).length);
for (const r of rows.filter(r => !r.exists)) console.log('MISSING', r.name, r.img);
