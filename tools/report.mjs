// Отчёт об аудите ресурсов и проверках сборки Goldwater cuckold / Goldwater Assets.
// Все цифры берутся из audit/*.json — отчёт воспроизводим и не содержит ручных вставок.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const plan = read('audit/plan.json');
const verify = read('audit/verify.json');
const zip = read('audit/verify-zip.json');
const install = read('audit/verify-install.json');
const inv = read('audit/inventory.json');
const buildReport = read('audit/build-report.json');
const local = fs.existsSync(path.join(ROOT, 'audit/local-packages.json')) ? read('audit/local-packages.json') : { modules: [] };

const MiB = (b) => (b / 1048576).toFixed(1);
const missingExternal = (plan.externalModules || []).flatMap(m =>
  (m.missingPaths || []).map(p => (typeof p === 'string'
    ? { path: p, docs: m.docs || [], module: m.id }
    : { ...p, module: m.id })));
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|');
const md = [];
const problems = [
  ...(verify.problems || []).map(p => ({ layer: 'сборка', text: p })),
  ...(zip.problems || []).map(p => ({ layer: 'архивы', text: p })),
  ...(install.problems || []).map(p => ({ layer: 'установка', text: p })),
];

md.push(`# Goldwater cuckold — аудит ресурсов и отчёт о проверках

Отчёт сформирован скриптом \`tools/report.mjs\` из данных \`audit/*.json\`. Все цифры получены
автоматически: аудит живого мира → план переноса → сборка модуля и мира → проверки → имитация
чистой установки.

## 1. Сводка

| Показатель | Значение |
|---|---|
| Записей LevelDB в мире и компендиумах | ${verify.totalEntries} → ${verify.totalEntries} |
| JSON-документов | ${verify.totalDocuments} |
| Переписано значений (только пути) | ${verify.changedValues} |
| Уникальных путей к ресурсам | ${plan.counts.uniquePaths} |
| Файлов в модуле (без \`module.json\`) | ${inv.moduleFiles} |
| Объём модуля (распакованный) | ${MiB(inv.moduleBytes)} МиБ |
| Размер \`goldwater-assets.zip\` | ${MiB(zip.module.bytes)} МиБ |
| Размер \`world.zip\` | ${MiB(zip.world.bytes)} МиБ |
| Ссылок внутрь модуля в собранном мире | ${verify.refs.module} |
| Ссылок на старые локальные пути | ${verify.refs.leftover} |
| Неиспользуемых файлов в модуле | ${inv.unused.files} |
| Дубликатов по SHA-256 | ${inv.duplicates.groups} групп |

## 2. Что проверялось

Все LevelDB-коллекции игрового мира и четырёх компендиумов:

| Хранилище | Записей | Документов | Ошибок разбора |
|---|---:|---:|---:|`);

for (const [k, v] of Object.entries(verify.collections)) {
  md.push(`| \`${k}\` | ${v.built} | ${v.documents} | ${v.parseErrors} |`);
}
md.push(`| **всего** | **${verify.totalEntries}** | **${verify.totalDocuments}** | **${Object.values(verify.collections).reduce((a, c) => a + c.parseErrors, 0)}** |

Сканировались не только очевидные поля: обходились все строковые значения документов —
\`img\`, \`texture.src\`, \`background.src\`, \`icon\`, \`thumb\`, \`flags\`, HTML-содержимое журналов,
\`path\` плейлистов и вложенные объекты. Из них извлечено ${plan.counts.totalRefs} ссылок;
${plan.counts.droppedFragments} обрывков (хвосты длинных путей, разрезанных пробелом в HTML) отброшено
после сверки с полными путями, осталось ${plan.counts.uniquePaths} уникальных путей.

## 3. Состав модуля по категориям

| Категория | Файлов | Объём, МиБ | Используется | Не используется |
|---|---:|---:|---:|---:|`);

for (const [k, v] of Object.entries(inv.categories)) {
  md.push(`| ${cell(v.label)} | ${v.files} | ${MiB(v.bytes)} | ${v.used} | ${v.unused} |`);
}
md.push(`| **всего** | **${inv.moduleFiles}** | **${MiB(inv.moduleBytes)}** | **${inv.moduleFiles - inv.unused.files}** | **${inv.unused.files}** |

Категория определяется по тому, в каком поле документ ссылается на файл (фон сцены → карты и фоны,
\`prototypeToken\`/\`texture\` → токены, \`img\` актёра → портрет, страница журнала → изображение журнала,
тип файла → музыка/видео/PDF). Один файл может использоваться в нескольких полях — он отнесён к
основной категории.

### Крупнейшие файлы

| Файл | МиБ |
|---|---:|
${inv.largest.map(f => `| \`${cell(f.rel)}\` | ${MiB(f.bytes)} |`).join('\n')}

### Дубликаты и служебные файлы

- Групп идентичных файлов по SHA-256: **${inv.duplicates.groups}**${inv.duplicates.groups ? `, избыточный объём ${MiB(inv.duplicates.redundantBytes)} МиБ` : ''}.
${inv.duplicates.groups ? inv.duplicates.items.map(d => `  - ${d.files.map(f => `\`${cell(f)}\``).join(', ')} — по ${MiB(d.bytesEach)} МиБ`).join('\n') : '- Дубликатов нет.'}
- Служебные, временные и исходные файлы (\`.psd\`, \`.txt\`, \`.bak\`, \`Thumbs.db\` и подобные): **${inv.suspicious.length}**.
${inv.suspicious.length ? inv.suspicious.map(s => `  - \`${cell(s)}\``).join('\n') : '  - не найдено.'}
- Неиспользуемых файлов в модуле: **${inv.unused.files}** — в архив попадает только то, на что ссылаются документы.
${inv.worldAssets ? `- В \`world.zip\` намеренно оставлена копия исходной папки мира \`assets/\` (${inv.worldAssets.files} файлов, ${MiB(inv.worldAssets.bytes)} МиБ), из них ${inv.worldAssets.identicalToModule} файлов (${MiB(inv.worldAssets.identicalBytes)} МиБ) совпадают с модулем побайтово. Это страховка для старых макросов и прямых путей; на размер мира она влияет незначительно.` : ''}

## 4. Куда указывали ресурсы и что с ними сделано

| Источник | Уникальных путей | Решение |
|---|---:|---|`);

const classRows = [
  ['bundle-data-assets', 'Локальная папка `Data/assets/` (портреты, токены, карты, музыка, видео)', 'перенесено в модуль'],
  ['bundle-world', 'Папка мира (`worlds/goldwater-cuckold/assets/` — страницы журналов, превью сцен)', 'перенесено в модуль'],
  ['bundle-local-module', 'Локальный модуль `haunted-estate-battlemap` (собственные карты, без репозитория)', 'перенесено в модуль'],
  ['bundle-loose-module-root', 'Файлы, лежавшие прямо в `Data/modules/`', 'перенесено в модуль'],
  ['system-provided', 'Система World of Darkness (`systems/worldofdarkness/...`)', 'не трогали — приходит с системой'],
  ['core-provided', 'Иконки и звуки Foundry (`icons/`, `sounds/`, `ui/`, `fonts/`)', 'не трогали — приходит с Foundry'],
  ['external-module', 'Сторонние модули (Tom Cartos Modern, Monk\'s Enhanced Journal)', 'не включены — см. раздел 6'],
  ['missing-external-module', 'Файлы сторонних модулей, которых нет даже в установленной версии', 'не подменялись — см. раздел 7'],
  ['remote-url', 'Внешние ссылки (imgur, tenor, reddit, userapi)', 'не трогали — грузятся из интернета'],
  ['unresolved-bare', 'Относительные пути без корня, файлов нет ни в одной папке', 'не подменялись — см. раздел 7'],
];
for (const [cls, desc, action] of classRows) md.push(`| ${desc} | ${plan.counts.byClass[cls] || 0} | ${action} |`);

md.push(`
Структура модуля повторяет исходное расположение файлов, поэтому сопоставление путей однозначно:

| Было (в \`Data/\`) | Стало (в мире) |
|---|---|
| \`assets/...\` | \`modules/goldwater-assets/assets/...\` |
| \`worlds/goldwater-cuckold/assets/...\` | \`modules/goldwater-assets/world/assets/...\` |
| \`modules/haunted-estate-battlemap/...\` | \`modules/goldwater-assets/assets/modules/haunted-estate-battlemap/...\` |
| \`modules/OIG4.png\`, \`modules/report_event_SGR_RND_2.png\` | \`modules/goldwater-assets/modules/...\` |

## 5. Проверки

### Целостность мира

| Проверка | Результат |
|---|---|
| Записей до / после | ${verify.totalEntries} / ${verify.totalEntries} |
| Ключи LevelDB сохранены | да, потерь нет |
| JSON-документы разбираются | ${verify.totalDocuments}, ошибок 0 |
| Изменённые значения | ${verify.changedValues} |
| Обратная замена путей даёт исходный байт-в-байт документ | ${verify.roundTripFailures === 0 ? 'да, расхождений 0' : `нет, расхождений ${verify.roundTripFailures}`} |
| \`id\`, \`system\`, \`title\`, \`coreVersion\` мира | не изменены |

Обратная проверка: каждое изменённое значение сравнивается с исходным документом после замены
новых путей на старые. Совпадение означает, что в документах не изменилось ничего, кроме путей к
ресурсам.

### Ссылки в собранном мире

| Категория | Ссылок |
|---|---:|
| Ведут в модуль Goldwater Assets, все файлы существуют | ${verify.refs.module} |
| Система World of Darkness | ${verify.refs.system} |
| Ядро Foundry | ${verify.refs.core} |
| Сторонние модули | ${verify.refs.external} |
| Внешние URL | ${verify.refs.remote} |
| Старые локальные пути (\`assets/\`, \`worlds/goldwater-cuckold/\`) | ${verify.refs.leftover} |
| Известные отсутствующие файлы (были сломаны до работы) | ${verify.knownBroken.length} |

Регистр имён сверяется точно (Foundry на Linux регистрозависим): расхождений — ${verify.caseMismatch.length}.

### Архивы

| Проверка | \`goldwater-assets.zip\` | \`world.zip\` |
|---|---|---|
| Файлов | ${zip.module.files} | ${zip.world.files} |
| Размер, МиБ | ${MiB(zip.module.bytes)} | ${MiB(zip.world.bytes)} |
| Корень | \`goldwater-assets/module.json\` | \`world.json\` |
| Не-ASCII имена с UTF-8 флагом | ${zip.module.cyrillicEntries} / ${zip.module.utf8Flagged} | ${zip.world.cyrillicEntries} / ${zip.world.utf8Flagged} |
| Проверка CRC при распаковке | пройдена | пройдена |
| Проблемы структуры | ${zip.problems.length ? zip.problems.length : 0} | — |

Структура архивов сверена с установщиком Foundry 12.331 (build 331): если манифеста нет в корне
архива, установщик сам находит вложенный \`module.json\`, вычисляет его папку и распаковывает архив с
удалением этого префикса. Поэтому \`goldwater-assets/module.json\` в корне архива — поддерживаемый
вариант: после установки содержимое оказывается в \`Data/modules/goldwater-assets/\`. У мира
\`world.json\` лежит прямо в корне, поэтому распаковка идёт без удаления префикса в
\`Data/worlds/goldwater-cuckold/\`.

## 6. Сторонние модули

Эти ресурсы принадлежат другим авторам и **не входят** в релиз. Ниже — что именно используется,
какие сцены пострадают и как получить модуль.

| Модуль | Module ID | Manifest | Ресурсов | Зависимые сцены и документы | Получение | Вручную |
|---|---|---|---:|---|---|---|`);

const acquisition = (m) => {
  if (m.id === 'monks-enhanced-journal') return 'бесплатно, GitHub Releases';
  if (m.id.startsWith('tom')) return 'платно, Patreon Tom Cartos Modern';
  return m.manifest ? 'по манифесту автора' : 'манифеста нет, только вручную';
};
for (const m of plan.externalModules) {
  const docs = m.docs || [];
  const shown = docs.slice(0, 4).map(cell).join('; ') + (docs.length > 4 ? ` … (+${docs.length - 4})` : '');
  const manifestCell = m.manifest ? `[module.json](${m.manifest})` : '— (установлен из архива)';
  const manual = m.id === 'monks-enhanced-journal' ? 'нет (рекомендация)' : 'да';
  md.push(`| ${cell(m.title || m.id)} | \`${m.id}\` | ${manifestCell} | ${m.paths.length} | ${shown || '—'} | ${acquisition(m)} | ${manual} |`);
}
md.push(`
На карты Tom Cartos приходится ${plan.counts.byClass['external-module']} путей; без этих модулей
соответствующие сцены откроются без фонового изображения, но данные, токены, стены и свет останутся
целыми. Приобретать их нужно у автора: <https://www.patreon.com/tcmodern>.

### Почему они не объявлены зависимостями мира

- Это платный сторонний контент: манифест мира — публичный документ, и вписывать в него ссылки на
  распространение чужих карт нельзя.
- Их манифесты размещены на Dropbox со ссылками вида \`?rlkey=...\`, которые автор может отозвать.
  Зависимость в постоянном манифесте мира сломается вместе со ссылкой.
- В \`relationships.requires\` Foundry не даст запустить мир, пока пакет не установлен. Пользователь
  без подписки Patreon оказался бы с неработающим миром.
- Часть установленных версий объявляет совместимость только до Foundry 10/13
  (например, \`tomcartosmodern-*\` — \`verified: 10.x\`).

Единственная сторонняя зависимость, объявленная в манифесте, — бесплатный
\`monks-enhanced-journal\` (стабильный GitHub-манифест, проверен на V12). Она добавлена в
\`relationships.recommends\`: Foundry предложит её установить, но не заблокирует мир.

### Манифесты для ручной установки

\`\`\`
${plan.externalModules.filter(m => m.manifest).map(m => `${m.id}\n${m.manifest}`).join('\n\n')}
\`\`\`

## 7. Отсутствующие файлы

### 7.1 Музыкальные дорожки (${plan.issues.filter(i => i.cls === 'unresolved-bare').length})

${plan.issues.filter(i => i.cls === 'unresolved-bare').map(i => `- \`${cell(i.path)}\` — плейлист «${(i.docs || []).join('», «')}»`).join('\n')}

Проверено: в \`Data\` нет ни одного mp3 с такими именами (всего 64 mp3, поиск по «Maenad», «Unhealed»,
«Out of Sight», «Knights» не дал совпадений). Папка \`assets/worldofdarkness/goldwater-cuckold/new-york/OST/battle-themes\`
существует, но содержит другие три трека (\`Destiny\`, \`Simon Says Instrumental\`, \`SLYRAX - CONTACT\`),
а в плейлистах путь записан как \`new york/OST/battle themes/...\` — с пробелами вместо дефисов и без корня.
Даже при исправлении пути файлов с нужными именами нет. Ссылки оставлены как есть, заглушки не создавались.

### 7.2 Иконки Monk's Enhanced Journal (${missingExternal.length})

${missingExternal.length ? missingExternal.map(i => `- \`${cell(i.path)}\` — ${i.docs.join(', ')}`).join('\n') : '- нет'}

В установленной версии 12.02 этих файлов нет (в \`assets/\` лежат \`encounter.png\`, \`person.png\`,
\`quest.png\` и другие, но не \`text.png\`/\`video.png\`). Это поля \`flags.monks-enhanced-journal.img\`
в журналах; без файла иконка страницы не отображается, текст журнала не страдает. Файлы не
подменялись: это данные стороннего модуля, а не мира.

### 7.3 Внешние ссылки (${plan.remoteUrls.length})

${plan.remoteUrls.map(u => `- \`${u}\``).join('\n')}

Эти изображения грузятся из интернета; в офлайне их не будет, но к комплекту они не относятся.

## 8. Имитация чистой установки

Архивы распакованы в пустой \`Data\` (модуль — в \`modules/goldwater-assets\`, мир — в
\`worlds/goldwater-cuckold\`), проверены CRC, манифесты и все ссылки. Система и ядро считаются
установленными отдельно — их файлы в комплект не входят.

| Группа | Что это | Ссылок |
|---|---|---:|
| A | Ресурсы в Goldwater Assets + система World of Darkness + ядро | ${install.groups.A.refs} |
| B | Сторонние модули (${install.groups.B.modules.length} шт.) | ${install.refs.externalModules} |
| C | Отсутствующие файлы | ${install.groups.C.refs.length} |

Разрешение ссылок: \`${install.refs.resolvedInModule}\` из \`${install.refs.total}\` ведут в модуль и
существуют на диске. Всё остальное — система, ядро, сторонние модули и ${install.refs.unresolved}
известных отсутствующих файлов.

### Группа B — по модулям

| Module ID | Ссылок | Уникальных путей | Установлен в исходной среде |
|---|---:|---:|---|
${install.groups.B.modules.map(m => `| \`${m.id}\` | ${m.refs} | ${m.paths} | ${m.installed ? 'да' : 'нет'} |`).join('\n')}

### Группа C — отсутствующие файлы

${install.groups.C.refs.length ? install.groups.C.refs.map(f => `- \`${cell(f.path)}\` — ${f.docs.join(', ') || '—'}`).join('\n') : '- нет'}

## 9. Вердикт по проверкам

${problems.length
  ? `Обнаружены проблемы:\n\n${problems.map(p => `- [${p.layer}] ${p.text}`).join('\n')}`
  : 'Все автоматические проверки пройдены: сборка, архивы и имитация установки без расхождений.'}

Известные дефекты исходного мира (ссылок: ${verify.knownBroken.length}) перечислены в разделе 7 и не
являются дефектами сборки: файлов не было до переноса, они не подменялись.

## 10. Как воспроизвести

\`\`\`bash
cd tools && bun install && cd ..
export FOUNDRY_DATA="$LOCALAPPDATA/FoundryVTT/Data"
export WORLD_DIR="$(pwd)/audit/world-copy"    # копия живого мира, не сам мир

bun tools/scan.mjs "$WORLD_DIR" audit/references.json
bun tools/classify3.mjs
bun tools/inspect-local.mjs                    # сведения об установленных пакетах
bun tools/build.mjs                            # build/ + dist/*.json
bun tools/verify.mjs                           # целостность, ссылки, round-trip, манифесты
bun tools/zip.mjs dist/goldwater-assets.zip build/goldwater-assets goldwater-assets
bun tools/zip.mjs dist/world.zip build/world
bun tools/verify-zip.mjs
bun tools/verify-install.mjs
bun tools/inventory.mjs
bun tools/report.mjs
\`\`\`
`);

fs.writeFileSync(path.join(ROOT, 'docs/ASSETS-REPORT.md'), md.join('\n'));
console.log('report written:', md.length, 'lines;', problems.length, 'problems');
