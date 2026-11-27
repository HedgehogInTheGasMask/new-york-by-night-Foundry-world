// Minimal ZIP writer: exact UTF-8 flags, deflate for text, store for already-compressed media.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const STORE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp3', '.mp4', '.ogg', '.m4a', '.mpd', '.woff2', '.ttf', '.otf', '.avif', '.webm']);
const dosTime = (d) => {
  const time = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() / 2) & 31);
  const date = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
  return { time, date };
};

export function makeZip(outFile, rootDir, { prefix = '' } = {}) {
  const entries = [];
  const walk = (dir, relBase) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, e.name);
      if (e.name === 'LOCK') continue;   // LevelDB runtime lock, never shipped
      const rel = relBase ? `${relBase}/${e.name}` : e.name;
      if (e.isDirectory()) { entries.push({ dir: true, rel }); walk(full, rel); }
      else entries.push({ dir: false, rel, full });
    }
  };
  walk(rootDir, '');

  const fd = fs.openSync(outFile, 'w');
  const central = [];
  let offset = 0;
  const writeBuf = (b) => { fs.writeSync(fd, b); offset += b.length; };

  for (const ent of entries) {
    const name = (prefix ? `${prefix}/${ent.rel}` : ent.rel) + (ent.dir ? '/' : '');
    const nameBuf = Buffer.from(name, 'utf8');
    const flags = /[^\x00-\x7f]/.test(name) ? 0x0800 : 0x0000;
    let data = Buffer.alloc(0);
    let raw = Buffer.alloc(0);
    let method = 0;
    let stat = null;
    if (!ent.dir) {
      stat = fs.statSync(ent.full);
      raw = fs.readFileSync(ent.full);
      const ext = path.extname(ent.full).toLowerCase();
      if (STORE_EXT.has(ext) || raw.length < 128) data = raw;
      else { data = zlib.deflateRawSync(raw, { level: 6 }); method = 8; }
    }
    const crc = crc32(raw);
    const size = raw.length;
    const { time, date } = dosTime(stat ? stat.mtime : new Date());

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    const localOffset = offset;
    writeBuf(local); writeBuf(nameBuf);
    if (!ent.dir) writeBuf(data);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(flags, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(time, 12);
    cd.writeUInt16LE(date, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(size, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(((ent.dir ? 0o40755 : 0o100644) << 16) >>> 0, 38);
    cd.writeUInt32LE(localOffset, 42);
    central.push(Buffer.concat([cd, nameBuf]));
  }

  const cdOffset = offset;
  for (const c of central) writeBuf(c);
  const cdSize = offset - cdOffset;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);
  writeBuf(eocd);
  fs.closeSync(fd);
  return { files: entries.filter(e => !e.dir).length, bytes: fs.statSync(outFile).size };
}

if (import.meta.main) {
  const [, , outFile, rootDir, prefix] = process.argv;
  const t = Date.now();
  const r = makeZip(outFile, rootDir, { prefix: prefix || '' });
  console.log(`wrote ${outFile}: ${r.files} files, ${(r.bytes / 1048576).toFixed(1)} MiB in ${((Date.now() - t) / 1000).toFixed(1)}s`);
}
