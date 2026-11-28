// Dump actors, scenes, folders, settings and modules from a Foundry world's LevelDB.
// Foundry stores embedded documents in keys like !scenes.walls!<sceneId>.<wallId>, so
// top-level documents are selected by an exact key shape.
import fs from 'node:fs';
import path from 'node:path';
import { ClassicLevel } from 'classic-level';

const WORLD = process.argv[2];
const OUT = process.argv[3] || 'audit/world-dump.json';
if (!WORLD) throw new Error('usage: dump-world.mjs <worldDir> [out]');

const COLLECTIONS = {
  actors: 'actors', scenes: 'scenes', folders: 'folders', journal: 'journal',
  items: 'items', macros: 'macros', settings: 'settings', cards: 'cards',
  playlists: 'playlists', tables: 'tables', users: 'users',
};

async function readRaw(dir) {
  const docs = new Map();
  const embedded = new Map();
  if (!fs.existsSync(dir)) return { docs, embedded };
  const db = new ClassicLevel(dir, { keyEncoding: 'buffer', valueEncoding: 'buffer', createIfMissing: false });
  await db.open();
  for await (const [k, v] of db.iterator()) {
    const key = k.toString('utf8');
    const text = v.toString('utf8');
    if (!text || text === 'null') continue;
    let doc;
    try { doc = JSON.parse(text); } catch { continue; }
    const top = key.match(/^!([a-z]+)!([^.]+)$/);
    if (top) { top[0]; docs.set(top[2], doc); continue; }
    const emb = key.match(/^!([a-z]+)\.([a-z-]+)!([^.]+)\.(.+)$/);
    if (emb) {
      const bucket = `${emb[1]}.${emb[2]}`;
      if (!embedded.has(bucket)) embedded.set(bucket, new Map());
      const byParent = embedded.get(bucket);
      if (!byParent.has(emb[3])) byParent.set(emb[3], []);
      byParent.get(emb[3]).push(doc);
    }
  }
  await db.close();
  return { docs, embedded };
}

const result = { embeddedCounts: {} };
for (const [name, coll] of Object.entries(COLLECTIONS)) {
  const { docs, embedded } = await readRaw(path.join(WORLD, 'data', coll));
  result[name] = [...docs.values()];
  for (const [bucket, byParent] of embedded) {
    let n = 0;
    for (const arr of byParent.values()) n += arr.length;
    result.embeddedCounts[bucket] = n;
    result[bucket.replace('.', '_')] = Object.fromEntries(byParent);
  }
}

const slimScene = (s) => ({
  _id: s._id,
  name: s.name,
  folder: s.folder || null,
  background: s.background?.src ?? s.img ?? null,
  foreground: s.foreground ?? null,
  thumb: s.thumb ?? null,
  width: s.width,
  height: s.height,
  grid: s.grid,
  padding: s.padding,
  weather: s.weather ?? null,
  flags: s.flags ?? {},
  ownership: s.ownership,
  navName: s.navName,
  active: s.active,
});

const slimActor = (a) => ({
  _id: a._id,
  name: a.name,
  type: a.type,
  folder: a.folder || null,
  img: a.img ?? null,
  tokenImg: a.prototypeToken?.texture?.src ?? null,
  tokenScale: a.prototypeToken?.texture?.scaleX ?? null,
  tokenName: a.prototypeToken?.name ?? null,
  randomImg: a.prototypeToken?.randomImg ?? false,
  tokenFlags: a.prototypeToken?.flags ?? null,
  actorFlags: Object.fromEntries(Object.entries(a.flags || {}).filter(([k]) => k !== 'worldofdarkness')),
  ownership: a.ownership,
  system: a.system ? Object.keys(a.system) : [],
  itemCount: (a.items || []).length,
  effectCount: (a.effects || []).length,
});

result.summary = {
  actorCount: result.actors.length,
  sceneCount: result.scenes.length,
  folderCount: result.folders.length,
  journalCount: result.journal.length,
  itemCount: result.items.length,
  macroCount: result.macros.length,
  actorTypes: result.actors.reduce((m, a) => ((m[a.type] = (m[a.type] || 0) + 1), m), {}),
  embeddedCounts: result.embeddedCounts,
};

result.actorIndex = result.actors.map(slimActor);
result.sceneIndex = result.scenes.map(slimScene);
result.folderIndex = result.folders.map(f => ({ _id: f._id, name: f.name, type: f.type, folder: f.folder || null, color: f.color, sort: f.sort }));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result.summary, null, 2));
