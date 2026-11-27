// Audit scanner: walks all world + compendium LevelDB collections and extracts every asset reference.
import { ClassicLevel } from 'classic-level';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');
const WORLD = process.argv[2];   // world copy dir (world.json + data/ + packs/)
const OUT = process.argv[3];

const MEDIA_EXT = 'png|jpe?g|webp|gif|svg|avif|bmp|tiff?|mp3|ogg|oga|wav|m4a|flac|aac|opus|mp4|webm|ogv|mov|m4v|pdf|mpd|m3u8|ttf|otf|woff2?';
const EXT_RE = new RegExp(`\\.(?:${MEDIA_EXT})(?![A-Za-z0-9])`, 'gi');
const ROOT_RE = /^(?:assets|worlds|systems|modules|icons|ui|cards|fonts|sounds|media)\//i;
const PATHCH = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_./\\%+~@$&\'!(),;=[]{}#:?*-');
const isPathChar = (c) => PATHCH.has(c) || (c >= '\u0400' && c <= '\u04FF') || (c >= '\u2010' && c <= '\u2015');

function walkJSON(node, out, jpath) {
  if (typeof node === 'string') {
    out.push({ jpath, value: node });
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => walkJSON(v, out, `${jpath}[${i}]`));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walkJSON(v, out, jpath ? `${jpath}.${k}` : k);
  }
}

const WHOLE_RE = new RegExp(`^.{1,400}\\.(?:${MEDIA_EXT})$`, 'i');
function tokensFromString(s) {
  const found = new Set();
  const t = s.trim();
  // a field whose whole value is a file path (may contain spaces or Cyrillic)
  if (WHOLE_RE.test(t) && !t.includes('\n')) found.add(t);
  EXT_RE.lastIndex = 0;
  let m;
  while ((m = EXT_RE.exec(s)) !== null) {
    const end = m.index + m[0].length;
    let start = m.index;
    while (start > 0 && end - start < 600 && isPathChar(s[start - 1])) start--;
    found.add(s.slice(start, end));
  }
  // also catch root-prefixed paths without media extension (folders / odd files)
  if (ROOT_RE.test(s) && s.length < 400 && !/\s/.test(s)) found.add(s);
  // src/href attributes that point at root-relative files without a media extension
  for (const mm of s.matchAll(/(?:src|href)\s*=\s*["']([^"']{1,300})["']/gi)) {
    if (ROOT_RE.test(mm[1])) found.add(mm[1]);
  }
  return [...found];
}

async function openDB(dir) {
  const db = new ClassicLevel(dir, {
    keyEncoding: 'buffer', valueEncoding: 'buffer', createIfMissing: false,
  });
  await db.open();
  return db;
}

async function scanDB(dir, collection, refs, stats) {
  let db;
  try { db = await openDB(dir); } catch (e) {
    stats.errors.push({ dir, error: String(e.message || e) });
    return;
  }
  let n = 0, bad = 0;
  const prefixes = {};
  for await (const [k, v] of db.iterator()) {
    n++;
    const key = k.toString('utf8');
    const pfx = key.split('!').slice(0, 2).join('!');
    prefixes[pfx] = (prefixes[pfx] || 0) + 1;
    let doc;
    try { doc = JSON.parse(v.toString('utf8')); } catch (e) { bad++; continue; }
    const strings = [];
    walkJSON(doc, strings, '');
    const docName = String(doc.name ?? doc.label ?? doc.title ?? '').slice(0, 80);
    for (const { jpath, value } of strings) {
      const whole = value.trim();
      const isWhole = WHOLE_RE.test(whole) && !whole.includes('\n');
      if (isWhole) refs.push({ collection, key, docName, jpath, raw: whole, whole: true });
      for (const tok of tokensFromString(value)) {
        if (isWhole && tok === whole) continue;
        refs.push({ collection, key, docName, jpath, raw: tok, whole: false });
      }
    }
  }
  stats.entries[collection] = { dir: path.basename(dir), count: n, unparsable: bad, keyPrefixes: prefixes };
  await db.close();
}

const refs = [];
const stats = { entries: {}, errors: [] };

const collections = fs.readdirSync(path.join(WORLD, 'data')).filter(d =>
  fs.statSync(path.join(WORLD, 'data', d)).isDirectory());
for (const c of collections) {
  await scanDB(path.join(WORLD, 'data', c), `world:${c}`, refs, stats);
}
if (fs.existsSync(path.join(WORLD, 'packs'))) {
  for (const p of fs.readdirSync(path.join(WORLD, 'packs'))) {
    const d = path.join(WORLD, 'packs', p);
    if (fs.statSync(d).isDirectory()) await scanDB(d, `pack:${p}`, refs, stats);
  }
}

// world.json itself
try {
  const wj = JSON.parse(fs.readFileSync(path.join(WORLD, 'world.json'), 'utf8'));
  const strings = [];
  walkJSON(wj, strings, '');
  for (const { jpath, value } of strings) {
    for (const tok of tokensFromString(value)) refs.push({ collection: 'world.json', key: 'world.json', docName: wj.title || '', jpath, raw: tok });
  }
} catch (e) { stats.errors.push({ dir: 'world.json', error: String(e) }); }

fs.writeFileSync(OUT, JSON.stringify({ stats, refs }, null, 1));
console.log('refs:', refs.length);
console.log('db entries:', JSON.stringify(stats.entries, null, 1));
console.log('errors:', JSON.stringify(stats.errors));
