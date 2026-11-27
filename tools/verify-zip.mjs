// Проверка структуры ZIP-архивов (без распаковки): имена, корневая папка, обязательные файлы.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');
const problems = [];

function readCentral(file) {
  const fd = fs.openSync(file, 'r');
  const size = fs.fstatSync(fd).size;
  const tailLen = Math.min(size, 66000);
  const tail = Buffer.alloc(tailLen);
  fs.readSync(fd, tail, 0, tailLen, size - tailLen);
  let eocd = -1;
  for (let i = tailLen - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('EOCD not found');
  const count = tail.readUInt16LE(eocd + 10);
  const cdSize = tail.readUInt32LE(eocd + 12);
  const cdOffset = tail.readUInt32LE(eocd + 16);
  const cd = Buffer.alloc(cdSize);
  fs.readSync(fd, cd, 0, cdSize, cdOffset);
  const names = [];
  let p = 0;
  let utf8 = 0;
  for (let i = 0; i < count; i++) {
    if (cd.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory entry');
    const flags = cd.readUInt16LE(p + 8);
    const method = cd.readUInt16LE(p + 10);
    const csize = cd.readUInt32LE(p + 20);
    const usize = cd.readUInt32LE(p + 24);
    const nlen = cd.readUInt16LE(p + 28);
    const elen = cd.readUInt16LE(p + 30);
    const clen = cd.readUInt16LE(p + 32);
    const name = cd.subarray(p + 46, p + 46 + nlen).toString('utf8');
    if (flags & 0x0800) utf8++;
    names.push({ name, method, csize, usize, flags });
    p += 46 + nlen + elen + clen;
  }
  fs.closeSync(fd);
  return { names, utf8, size };
}

function checkModule() {
  const file = path.join(ROOT, 'dist/goldwater-assets.zip');
  const { names, utf8, size } = readCentral(file);
  const files = names.filter(n => !n.name.endsWith('/'));
  const tops = new Set(names.map(n => n.name.split('/')[0]));
  if (tops.size !== 1 || !tops.has('goldwater-assets')) problems.push(`module zip top level: ${[...tops]}`);
  if (!files.some(f => f.name === 'goldwater-assets/module.json')) problems.push('module.json missing at package root');
  const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/plan.json'), 'utf8'));
  const dstRelOf = (from) => from.startsWith('worlds/goldwater-cuckold/')
    ? `world/${from.slice('worlds/goldwater-cuckold/'.length)}` : from;
  const have = new Set(files.map(f => f.name));
  let missing = 0;
  for (const b of plan.bundle) if (!have.has(`goldwater-assets/${dstRelOf(b.from)}`)) missing++;
  if (missing) problems.push(`${missing} bundled files missing from module zip`);
  for (const f of names) if (/^[a-zA-Z]:|\\\\|^\//.test(f.name)) problems.push(`bad path in zip: ${f.name}`);
  const cyr = files.filter(f => /[^\x00-\x7f]/.test(f.name)).length;
  if (cyr && utf8 < cyr) problems.push(`utf8 flag not set on ${cyr - utf8} non-ascii entries`);
  return { file, bytes: size, files: files.length, expected: plan.bundle.length + 1, cyrillicEntries: cyr, utf8Flagged: utf8 };
}

function checkWorld() {
  const file = path.join(ROOT, 'dist/world.zip');
  const { names, utf8, size } = readCentral(file);
  const files = names.filter(n => !n.name.endsWith('/'));
  const tops = new Set(names.map(n => n.name.split('/')[0]));
  if (tops.has('world/') || tops.has('goldwater-cuckold')) problems.push(`world zip has a wrapper folder: ${[...tops]}`);
  if (!files.some(f => f.name === 'world.json')) problems.push('world.json missing at zip root');
  for (const need of ['data/actors/', 'data/scenes/', 'packs/characters/', 'packs/discipliny/', 'assets/']) {
    if (!names.some(n => n.name.startsWith(need))) problems.push(`world zip missing ${need}`);
  }
  if (names.some(n => /(^|\/)LOCK$/.test(n.name))) problems.push('stale LOCK files inside world zip');
  const desc = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/world/world.json'), 'utf8'));
  if (desc.id !== 'goldwater-cuckold') problems.push('world.json id changed');
  const cyr = files.filter(f => /[^\x00-\x7f]/.test(f.name)).length;
  return { file, bytes: size, files: files.length, cyrillicEntries: cyr, utf8Flagged: utf8 };
}

const out = { module: checkModule(), world: checkWorld(), problems };
fs.writeFileSync(path.join(ROOT, 'audit/verify-zip.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
if (problems.length) process.exitCode = 1;
