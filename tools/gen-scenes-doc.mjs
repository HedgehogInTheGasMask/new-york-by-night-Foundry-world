import fs from 'node:fs';
const r = JSON.parse(fs.readFileSync(new URL('../audit/verify-2.0.0.json', import.meta.url), 'utf8'));
const tc = r.sceneList.filter(s => s.background?.startsWith('modules/tom'));
const own = r.sceneList.filter(s => s.background?.startsWith('modules/goldwater-assets'));
const other = r.sceneList.filter(s => !s.background || (!s.background.startsWith('modules/tom') && !s.background.startsWith('modules/goldwater-assets')));
const packOf = (bg) => bg?.startsWith('modules/tom') ? bg.split('/')[1] : null;
const packNames = [...new Set(tc.map(s => packOf(s.background)))].sort();
const rows = r.sceneList.map(s => {
  const bg = s.background ?? '—';
  const src = bg.startsWith('modules/tom') ? `Tom Cartos · \`${packOf(bg)}\``
    : bg.startsWith('modules/goldwater-assets') ? 'Goldwater Assets'
    : bg === '—' ? 'нет фона' : bg;
  return `| ${s.name.replace(/\|/g, '\|')} | \`${s.id}\` | ${s.width}×${s.height} | ${s.grid.size ?? '—'} | ${s.walls} / ${s.doors}${s.secretDoors ? ` (${s.secretDoors} секр.)` : ''} | ${s.lights} | ${s.tokens} | ${s.notes} | ${src} |`;
}).join('\n');
const fx = r.sceneList.filter(s => s.fxmaster).map(s => `| ${s.name} | \`${s.id}\` | ${Object.values(s.fxmaster.effects ?? {}).map(e => e.type).join(', ') || '—'} |`).join('\n');
const md = `# Сцены мира

Всего сцен: **${r.sceneList.length}**. Таблица построена из финального архива \`world.zip\` релиза 2.0.0
(\`tools/verify-v2.mjs\`), а не из локального мира: числа стен, дверей, света, токенов и заметок
считаны по записям LevelDB внутри архива.

Стены, двери, освещение, токены, заметки, звуки и тайлы сохранены один в один: сравнение с локальным
миром по каждой сцене проходит без расхождений (\`problems: []\`).

| Показатель | Значение |
|---|---:|
| Сцен | ${r.sceneList.length} |
| Записей стен | ${r.totals.walls} |
| Из них дверей | ${r.totals.doors} |
| Из них секретных дверей | ${r.totals.secretDoors} |
| Источников света | ${r.totals.lights} |
| Токенов | ${r.totals.tokens} |
| Заметок | ${r.totals.notes} |
| Звуков сцены | ${r.totals.sounds} |
| Тайлов | ${r.totals.tiles} |

## Источники карт

| Источник | Сцен |
|---|---:|
| Tom Cartos Modern (платные модули, в релиз не входят) | ${tc.length} |
| Goldwater Assets (входят в релиз) | ${own.length} |
| Без фона / прочее | ${other.length} |

Пакеты Tom Cartos, на которые опираются сцены: ${packNames.map(p => `\`${p}\``).join(', ')}.

## Эффекты FXMaster

| Сцена | ID | Эффекты |
|---|---|---|
${fx}

Сцена **New York** \`Uicwxtf2pNEmjfaS\` использует эталонные параметры:

- снег: \`scale 0.3\`, \`direction 90\`, \`speed 0.5\`, \`lifetime 5\`, \`density 0.8\`, \`alpha 1\`, \`tint.apply false\`;
- облака: \`scale 1.2\`, \`direction 90\`, \`speed 0.6\`, \`lifetime 5\`, \`density 0.099\`, \`alpha 1\`, \`tint.apply false\`.

Эти значения проверяются при каждой сборке: \`tools/build-world.mjs\` и \`tools/verify-v2.mjs\`
падают, если хотя бы один параметр отличается.

## Полный список

| Сцена | ID | Размер, px | Сетка | Стены / двери | Свет | Токены | Заметки | Фон |
|---|---|---|---:|---:|---:|---:|---:|---|
${rows}
`;
fs.writeFileSync(new URL('../docs/SCENES.md', import.meta.url), md);
console.log('scenes', r.sceneList.length, 'tc', tc.length, 'own', own.length, 'other', other.length, 'packs', packNames.length);
