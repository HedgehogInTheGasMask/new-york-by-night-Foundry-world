// Generate docs/TOKENS.md from the actor mapping produced by build-v3.mjs.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');
const actors = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/v3-actors.json'), 'utf8'));
const scenes = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/v3-scenes.json'), 'utf8'));
const build = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/build-v3.json'), 'utf8'));

const changed = actors.filter(a => a.changed);
const kept = actors.filter(a => !a.changed);
const withVariants = changed.filter(a => a.variants.length > 1);
const variantImages = changed.reduce((n, a) => n + Math.max(0, a.variants.length - 1), 0);
const distinctFiles = new Set(changed.flatMap(a => a.variants));

const esc = (s) => String(s).replace(/\|/g, '\\|');
const row = (a) => `| ${esc(a.actor)} | ${esc(a.folder)} | ${a.before ? `\`${esc(a.before.split('/').pop())}\`` : '—'} | ${a.main ? `\`${a.main}.png\`` : '—'} | ${a.variants.length > 1 ? a.variants.filter(v => v !== a.main).map(v => `\`${v}.png\``).join('<br>') : '—'} | ${esc(a.basis)} |`;

const lines = [];
lines.push('# Токены персонажей — 3.0.0', '');
lines.push('Все токены взяты из библиотеки **New York by Night** (`Токены VtM_ Нью-Йорк 2000 (3).html`');
lines.push('и два архива `vtm_ny2000_part1/2.zip`). Картинки лежат внутри архива мира:');
lines.push('`assets/tokens/vtm_ny2000/<категория>/<файл>.png`, в документах — `worlds/goldwater-cuckold/assets/tokens/...`.', '');
lines.push('## Сводка', '');
lines.push('| Показатель | Значение |');
lines.push('|---|---:|');
lines.push(`| Actor Documents в мире | ${actors.length} |`);
lines.push(`| Заменён основной токен | ${changed.length} |`);
lines.push(`| Оставлено прежнее изображение | ${kept.length} |`);
lines.push(`| Персонажей с вариантами Token Variant Art | ${withVariants.length} |`);
lines.push(`| Дополнительных изображений в вариантах | ${variantImages} |`);
lines.push(`| Различных файлов токенов в сборке | ${distinctFiles.size} |`);
lines.push(`| Сцен сохранено / удалено | ${scenes.keptScenes.length} / ${scenes.removedScenes.length} |`);
lines.push('');
lines.push('## Как устроены варианты', '');
lines.push('Для каждого персонажа записан флаг актора, который читает Token Variant Art 5.1.6:');
lines.push('');
lines.push('```json');
lines.push('flags.token-variants.variants = [{ "imgSrc": "worlds/goldwater-cuckold/assets/tokens/...", "names": ["Имя"] }]');
lines.push('```');
lines.push('');
lines.push('Кнопка вариантов на Token HUD показывает эти изображения и переключает `prototypeToken.texture.src`.');
lines.push('Основной токен — нейтральный вариант без оружия и предметов (`_noitems` / `_noweapon`), если он есть.', '');
lines.push('## Сопоставление', '');
lines.push('| Actor в Foundry | Папка | Исходное изображение | Основной токен | Дополнительные варианты | Основание |');
lines.push('|---|---|---|---|---|---|');
for (const a of [...actors].sort((x, y) => (x.changed === y.changed ? x.actor.localeCompare(y.actor, 'ru') : x.changed ? -1 : 1))) lines.push(row(a));
lines.push('');
lines.push('## Случайные NPC', '');
lines.push('Папка **Random asspull** (44 актора), **Brute Squad** (10), **(cuck)old** (18) и неканонические');
lines.push('персонажи остальных папок получили токены из общих категорий библиотеки (`kine`, `crime`, `club`,');
lines.push('`cam`, `indep`, `sabbat`, `ghoul`, `blood`, `undead`, `were`, `hunter`, `beast`). Пол определялся по');
lines.push('имени, поэтому женские и мужские токены не перепутаны; пулы перемешаны детерминированно, поэтому');
lines.push('повторов почти нет — на 86 «общих» персонажей приходится 85 разных основных токенов.', '');
lines.push('## Персонажи без нового токена', '');
lines.push('В библиотеке нет изображения именно этого персонажа, а своё уникальное изображение у него уже есть —');
lines.push('поэтому изображение оставлено прежним (подмена на «похожего» не делалась):', '');
for (const a of kept) lines.push(`- **${a.actor}** — \`${a.before}\` (${a.basis})`);
lines.push('');

fs.writeFileSync(path.join(ROOT, 'docs/TOKENS.md'), lines.join('\n'));
console.log('docs/TOKENS.md:', lines.length, 'lines;', actors.length, 'actors;', distinctFiles.size, 'files');
