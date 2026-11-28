// Probe every asset reference in the built world against a running Foundry that was
// installed from the published release archives. Anything not 200 is missing for users.
import fs from 'node:fs';
import path from 'node:path';
import { ClassicLevel } from 'classic-level';

const ROOT = path.resolve(import.meta.dir, '..');
const BUILD = path.join(ROOT, 'build/world-v3');
const ORIGIN = process.argv[2] || 'http://127.0.0.1:30124';

const refs = new Map();
const add = (p, where) => {
  if (typeof p !== 'string' || !p) return;
  if (/^(data:|blob:|http|icons\/|ui\/|sounds\/|systems\/|fonts\/|modules\/(fxmaster|token-variants|monks-enhanced-journal|lib-wrapper)\/)/.test(p)) return;
  if (!/\.(png|jpe?g|webp|gif|svg|mp4|webm|ogg|mp3|m4a|wav|pdf)$/i.test(p)) return;
  if (!refs.has(p)) refs.set(p, where);
};

for (const name of fs.readdirSync(path.join(BUILD, 'data'))) {
  const dir = path.join(BUILD, 'data', name);
  if (!fs.statSync(dir).isDirectory()) continue;
  const db = new ClassicLevel(dir, { keyEncoding: 'buffer', valueEncoding: 'buffer', createIfMissing: false });
  await db.open();
  for await (const [, v] of db.iterator()) {
    let doc; try { doc = JSON.parse(v.toString('utf8')); } catch { continue; }
    const walk = (o) => {
      if (typeof o === 'string') return add(o, `${name}:${doc.name ?? doc._id ?? ''}`);
      if (Array.isArray(o)) return o.forEach(walk);
      if (o && typeof o === 'object') Object.values(o).forEach(walk);
    };
    walk(doc);
  }
  await db.close();
}
const world = JSON.parse(fs.readFileSync(path.join(BUILD, 'world.json'), 'utf8'));
add(world.background, 'world.json:background');
add(world.thumb, 'world.json:thumb');

const bad = [];
let ok = 0;
for (const [p, where] of refs) {
  const url = `${ORIGIN}/${p.split('/').map(encodeURIComponent).join('/')}`;
  let status = 0;
  try {
    const r = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-1' } });
    status = r.status;
    await r.arrayBuffer();
  } catch (e) { status = -1; }
  if (status >= 200 && status < 300) ok++;
  else bad.push({ path: p, where, status });
}
console.log(JSON.stringify({ checked: refs.size, ok, missing: bad.length, bad }, null, 2));
