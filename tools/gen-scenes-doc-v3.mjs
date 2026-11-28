// Generate docs/SCENES.md for release 3.0.0 from the built world database.
import fs from 'node:fs';
import path from 'node:path';
import { ClassicLevel } from 'classic-level';

const ROOT = path.resolve(import.meta.dir, '..');
const BUILD = path.join(ROOT, 'build/world-v3');
const removed = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/v3-scenes.json'), 'utf8')).removedScenes;

const db = new ClassicLevel(path.join(BUILD, 'data/scenes'), { keyEncoding: 'buffer', valueEncoding: 'buffer', createIfMissing: false });
await db.open();
const scenes = new Map();
const per = new Map();
for await (const [k, v] of db.iterator()) {
  const key = k.toString('utf8');
  const doc = JSON.parse(v.toString('utf8'));
  const top = key.match(/^!scenes!([^.]+)$/);
  if (top) { scenes.set(doc._id, doc); continue; }
  const emb = key.match(/^!scenes\.([a-z]+)!([^.]+)\./);
  if (!emb) continue;
  if (!per.has(emb[2])) per.set(emb[2], {});
  per.get(emb[2])[emb[1]] = (per.get(emb[2])[emb[1]] || 0) + 1;
  if (emb[1] === 'walls') {
    const p = per.get(emb[2]);
    if (doc.door === 1) p.doors = (p.doors || 0) + 1;
    else if (doc.door === 2) { p.doors = (p.doors || 0) + 1; p.secret = (p.secret || 0) + 1; }
  }
}
await db.close();

const list = [...scenes.values()].map(s => {
  const c = per.get(s._id) ?? {};
  return {
    id: s._id, name: s.name, width: s.width, height: s.height, grid: s.grid?.size ?? '—',
    walls: c.walls ?? 0, doors: c.doors ?? 0, secret: c.secret ?? 0,
    lights: c.lights ?? 0, tokens: c.tokens ?? 0, notes: c.notes ?? 0, tiles: c.tiles ?? 0,
    background: s.background?.src ?? '—',
    weather: s.weather || '—',
    effects: Object.values(s.flags?.fxmaster?.effects ?? {}).map(e => e.type).join(', ') || '—',
  };
}).sort((a, b) => a.name.localeCompare(b.name, 'ru'));

const totals = list.reduce((t, s) => {
  for (const k of ['walls', 'doors', 'secret', 'lights', 'tokens', 'notes', 'tiles']) t[k] += s[k];
  return t;
}, { walls: 0, doors: 0, secret: 0, lights: 0, tokens: 0, notes: 0, tiles: 0 });

const rows = list.map(s => `| ${s.name.replace(/\|/g, '\\|')} | \`${s.id}\` | ${s.width}×${s.height} | ${s.grid} | ${s.walls} / ${s.doors}${s.secret ? ` (${s.secret} секр.)` : ''} | ${s.lights} | ${s.tokens} | ${s.notes} | ${s.tiles} | \`${s.background.split('/').pop()}\` |`).join('\n');
const fxRows = list.map(s => `| ${s.name} | \`${s.id}\` | ${s.effects} | ${s.weather} |`).join('\n');
const removedRows = removed.map(s => `| ${s.name.replace(/\|/g, '\\|')} | \`${s.id}\` | ${s.reason} |`).join('\n');

const md = `# Сцены мира

Всего сцен: **${list.length}**. Таблица построена из собранного архива \`world.zip\` релиза 3.0.0,
а не из локального мира: числа стен, дверей, света, токенов, заметок и тайлов считаны по записям
LevelDB внутри архива.

| Показатель | Значение |
|---|---:|
| Сцен | ${list.length} |
| Записей стен | ${totals.walls} |
| Из них дверей | ${totals.doors} |
| Из них секретных дверей | ${totals.secret} |
| Источников света | ${totals.lights} |
| Токенов | ${totals.tokens} |
| Заметок | ${totals.notes} |
| Тайлов | ${totals.tiles} |

## Эффекты FXMaster

| Сцена | ID | Эффекты | Погода |
|---|---|---|---|
${fxRows}

Снега нет ни на одной сцене. Облака \`core_clouds\` остались на обеих сценах New York, туман —
на \`Title Screen\` и \`Манхатан\`.

## Удалённые сцены

| Сцена | ID | Причина |
|---|---|---|
${removedRows}

## Полный список

| Сцена | ID | Размер, px | Сетка | Стены / двери | Свет | Токены | Заметки | Тайлы | Фон |
|---|---|---|---|---|---:|---:|---:|---:|---|
${rows}
`;

fs.writeFileSync(path.join(ROOT, 'docs/SCENES.md'), md);
console.log('scenes', list.length, 'walls', totals.walls, 'doors', totals.doors, 'lights', totals.lights, 'removed', removed.length);
