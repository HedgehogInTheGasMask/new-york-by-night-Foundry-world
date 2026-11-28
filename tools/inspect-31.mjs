// Read-only inspection for the 3.1.0 update: original actor portraits from the
// pre-3.0.0 backup, current 3.0.0 actor art, and the scene folder tree.
import fs from 'node:fs';
import path from 'node:path';
import { ClassicLevel } from 'classic-level';

const ROOT = path.resolve(import.meta.dir, '..');
const BUILT = path.join(ROOT, 'build/world-v3');
const BACKUP = 'C:/Users/user1/AppData/Local/FoundryVTT/_parity-backups/2026-11-28/world-goldwater-cuckold';

async function readAll(dir) {
  const db = new ClassicLevel(dir, { keyEncoding: 'buffer', valueEncoding: 'buffer' });
  await db.open();
  const out = [];
  try {
    for await (const [k, v] of db.iterator()) out.push([k.toString('utf8'), JSON.parse(v.toString('utf8'))]);
  } finally {
    await db.close();
  }
  return out;
}

const backupActors = (await readAll(path.join(BACKUP, 'data/actors')))
  .filter(([k]) => /^!actors![^.]+$/.test(k)).map(([, d]) => d);
const builtActors = (await readAll(path.join(BUILT, 'data/actors')))
  .filter(([k]) => /^!actors![^.]+$/.test(k)).map(([, d]) => d);
const folders = (await readAll(path.join(BUILT, 'data/folders'))).map(([, d]) => d);
const scenes = (await readAll(path.join(BUILT, 'data/scenes')))
  .filter(([k]) => /^!scenes![^.]+$/.test(k)).map(([, d]) => d);

const bm = new Map(backupActors.map(d => [d._id, d]));
const fm = new Map(folders.map(f => [f._id, f]));

const lines = [];
for (const a of builtActors.sort((x, y) => x.name.localeCompare(y.name, 'ru'))) {
  const b = bm.get(a._id);
  const tv = a.flags?.['token-variants']?.variants ?? [];
  lines.push([
    a._id,
    a.name,
    a.type,
    fm.get(a.folder)?.name ?? '',
    JSON.stringify(a.img ?? null),
    JSON.stringify(b?.img ?? null),
    JSON.stringify(a.prototypeToken?.texture?.src ?? null),
    JSON.stringify(b?.prototypeToken?.texture?.src ?? null),
    String(tv.length),
  ].join('\t'));
}
fs.writeFileSync(path.join(ROOT, 'audit/v31-actors.tsv'),
  'id\tname\ttype\tfolder\timg30\timgBackup\ttoken30\ttokenBackup\tvariants\n' + lines.join('\n') + '\n');

// scene folders
const sceneFolders = folders.filter(f => f.type === 'Scene');
const counts = new Map();
for (const s of scenes) counts.set(s.folder ?? '', (counts.get(s.folder ?? '') ?? 0) + 1);
const tree = sceneFolders.map(f => ({
  id: f._id, name: f.name, parent: f.parent ?? null, color: f.color ?? null,
  scenes: counts.get(f._id) ?? 0,
  children: folders.filter(c => (c.parent ?? null) === f._id).map(c => `${c.type}:${c.name}`),
}));
fs.writeFileSync(path.join(ROOT, 'audit/v31-scene-folders.json'), JSON.stringify({
  rootScenes: counts.get('') ?? 0,
  folders: tree,
  allFolders: folders.map(f => ({ id: f._id, name: f.name, type: f.type, parent: f.parent ?? null })),
}, null, 2));

console.log('backup actors', backupActors.length, 'built actors', builtActors.length);
console.log('scene folders', sceneFolders.length, 'scenes', scenes.length, 'root scenes', counts.get('') ?? 0);
console.log(JSON.stringify(tree, null, 2));
