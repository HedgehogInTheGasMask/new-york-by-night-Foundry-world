// Minimal ZIP extractor that honours the UTF-8 filename flag.
// Info-ZIP on this machine ignores the flag and turns Cyrillic names into mojibake.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const [, , zipPath, destDir] = process.argv;
if (!zipPath || !destDir) throw new Error('usage: unzip-utf8.mjs <zip> <dest>');

const buf = fs.readFileSync(zipPath);
const decodeName = (nameBuf, flags) => {
  // bit 11 => names are UTF-8
  if (flags & 0x0800) return nameBuf.toString('utf8');
  const utf8 = nameBuf.toString('utf8');
  return utf8.includes('\uFFFD') ? nameBuf.toString('latin1') : utf8;
};

let eocd = -1;
for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
  if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
}
if (eocd < 0) throw new Error('EOCD not found');
const count = buf.readUInt16LE(eocd + 10);
let ptr = buf.readUInt32LE(eocd + 16);

let files = 0;
for (let n = 0; n < count; n++) {
  if (buf.readUInt32LE(ptr) !== 0x02014b50) throw new Error(`bad central header at ${ptr}`);
  const flags = buf.readUInt16LE(ptr + 8);
  const method = buf.readUInt16LE(ptr + 10);
  const crc = buf.readUInt32LE(ptr + 16);
  const compSize = buf.readUInt32LE(ptr + 20);
  const size = buf.readUInt32LE(ptr + 24);
  const nameLen = buf.readUInt16LE(ptr + 28);
  const extraLen = buf.readUInt16LE(ptr + 30);
  const commentLen = buf.readUInt16LE(ptr + 32);
  const localOffset = buf.readUInt32LE(ptr + 42);
  const name = decodeName(buf.slice(ptr + 46, ptr + 46 + nameLen), flags);
  ptr += 46 + nameLen + extraLen + commentLen;

  if (name.endsWith('/')) { fs.mkdirSync(path.join(destDir, name), { recursive: true }); continue; }

  const lNameLen = buf.readUInt16LE(localOffset + 26);
  const lExtraLen = buf.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + lNameLen + lExtraLen;
  const data = buf.slice(dataStart, dataStart + compSize);
  const out = method === 0 ? data : zlib.inflateRawSync(data);

  const target = path.join(destDir, name);
  const parent = path.dirname(target);
  if (parent !== destDir) fs.mkdirSync(parent, { recursive: true });
  fs.writeFileSync(target, out);
  if (out.length !== size || (crc && zlib.crc32 ? zlib.crc32(out) !== crc : false)) {
    throw new Error(`size/crc mismatch for ${name}`);
  }
  files++;
}
console.log(`extracted ${files} files from ${path.basename(zipPath)} to ${destDir}`);
