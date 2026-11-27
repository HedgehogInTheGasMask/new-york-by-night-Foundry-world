# Сборка и публикация

## Инвариант релиза

Релиз содержит четыре файла — всегда все четыре, для мира и для модуля одновременно:

| Файл | Что это | Куда попадает у пользователя |
|---|---|---|
| `world.json` | манифест мира (Manifest URL мира) | Setup → Install World |
| `world.zip` | архив мира | `Data/worlds/goldwater-cuckold/` |
| `module.json` | манифест модуля ассетов | Setup → Install Module |
| `goldwater-assets.zip` | архив модуля ассетов | `Data/modules/goldwater-assets/` |
| `fxmaster.json` | манифест-зеркало FXMaster 5.0.1 | Setup → Install Module (снег и облака) |
| `fxmaster-5.0.1.zip` | неизменённый официальный архив FXMaster v5.0.1 | `Data/modules/fxmaster/` |

Manifest URL мира (`.../releases/latest/download/world.json`) менять нельзя — он уже прописан у
пользователей. Модуль использует `.../releases/latest/download/module.json`.

Отсюда правило: **каждый релиз обязан содержать `module.json` и `goldwater-assets.zip`**, даже если
менялся только мир. Иначе `/latest/` перестанет отдавать манифест модуля, и у пользователей сломается
проверка обязательной зависимости `goldwater-assets` при запуске мира. Обратное тоже верно: без
`world.json` и `world.zip` перестанет работать обновление мира.

GitHub ограничивает размер одного файла релиза 2 ГБ; текущие архивы (1,12 ГБ и 160 МБ) проходят с
запасом. ZIP не хранятся в git — они публикуются только как ассеты релиза.

Два последних файла — это FXMaster: манифест-зеркало `fxmaster/module.json` и официальный архив
v5.0.1 без единого изменения внутри (sha256 `1c7574caac13c8555cb4e961832dd93cfb8870e331b62089be62bf13202ee8df`).
Они не обязательны для запуска мира, но должны быть прикреплены к **каждому** релизу: README и
`docs/FXMASTER-SNOW.md` ссылаются на `.../releases/latest/download/fxmaster.json`, и после нового
релиза без этого ассета ссылка начнёт отдавать 404. Версия закреплена намеренно: 5.0.1 — эталон
снега, 7.x и 8.x рисуют его другим кодом.

## Сборка

Нужен [bun](https://bun.sh) и локальная установка Foundry с этим миром и его ассетами.
Foundry во время сборки должна быть **закрыта** либо использоваться копия мира: скрипты открывают
LevelDB, а живая база может держать блокировки. В примере ниже используется копия.

```bash
cd tools && bun install && cd ..

export FOUNDRY_DATA="$LOCALAPPDATA/FoundryVTT/Data"
export WORLD_DIR="$(pwd)/audit/world-copy"   # копия worlds/goldwater-cuckold, не сам мир

# 1. аудит ссылок в копии мира
bun tools/scan.mjs "$WORLD_DIR" audit/references.json
bun tools/classify3.mjs
bun tools/inspect-local.mjs        # сведения об установленных пакетах (id, версии, manifest)

# 2. сборка модуля и мира + манифесты в dist/
bun tools/build.mjs

# 3. проверки (должны завершиться с кодом 0)
bun tools/verify.mjs               # целостность LevelDB, ссылки, round-trip, манифесты
bun tools/zip.mjs dist/goldwater-assets.zip build/goldwater-assets goldwater-assets
bun tools/zip.mjs dist/world.zip build/world
bun tools/verify-zip.mjs           # структура архивов, корневые папки, UTF-8
bun tools/verify-install.mjs       # распаковка в пустой Data, проверка ссылок и CRC
bun tools/inventory.mjs            # категории, объём, дубликаты
bun tools/report.mjs               # docs/ASSETS-REPORT.md
```

Если менялся только состав ассетов, всё равно пересобирайте **оба** архива: `world.zip` содержит
LevelDB, а не только манифест, и должен соответствовать текущим путям.

### Что означают проверки

- `verify.mjs` — 25 999 записей LevelDB на месте, все JSON разбираются, ключи не потеряны; каждое
  изменённое значение после обратной замены путей совпадает с исходным документом байт-в-байт; все
  ссылки ведут в существующие файлы с точным регистром; в модуле нет неиспользуемых файлов.
- `verify-zip.mjs` — в модуле ровно `goldwater-assets/module.json` в корне (одна корневая папка),
  в мире `world.json` в корне и без лишних обёрток; `LOCK`-файлов нет, у не-ASCII имён стоит UTF-8 флаг.
- `verify-install.mjs` — имитация чистой установки: распаковка с проверкой CRC в пустой `Data`,
  сверка манифестов и всех ссылок; результат делится на A (модуль/система/ядро), B (сторонние
  модули) и C (отсутствующие файлы).
- На момент подготовки 1.1.0 все проверки проходят: `problems: []`. `verify.mjs` завершается с
  кодом 0, потому что три отсутствующих mp3 входят в известные дефекты исходного мира и перечислены
  в отчёте; любой новый нерешённый путь валит проверку.

### Структура архивов и установщик Foundry

Проверено по коду установщика Foundry 12.331: если `module.json` нет в корне архива, установщик
находит вложенный манифест, вычисляет его каталог и распаковывает архив с удалением этого префикса
(`removeRoot`). Поэтому модуль может содержать одну корневую папку — текущий вариант
`goldwater-assets/module.json` — и это корректно: после установки файлы оказываются в
`Data/modules/goldwater-assets/`. Архив мира обёртки не имеет: `world.json` лежит прямо в корне и
распаковывается в `Data/worlds/goldwater-cuckold/` без удаления префикса. Оба варианта проверяются
`verify-zip.mjs` и `verify-install.mjs`.

### Контрольные суммы

После сборки запишите хеши — они понадобятся, чтобы подтвердить, что в релиз ушли именно эти файлы:

```bash
sha256sum dist/world.json dist/world.zip dist/module.json dist/goldwater-assets.zip \
          dist/fxmaster.json dist/fxmaster-5.0.1.zip
```

`dist/fxmaster.json` — копия `fxmaster/module.json`; `dist/fxmaster-5.0.1.zip` — скачанный
официальный `module.zip` релиза v5.0.1 (не пересобирать: хеш должен совпадать с upstream).

```bash
```

## Публикация

```bash
gh release create v1.1.0 \
  dist/world.json dist/world.zip dist/module.json dist/goldwater-assets.zip \
  dist/fxmaster.json dist/fxmaster-5.0.1.zip \
  --title "Goldwater cuckold 1.1.0 + Goldwater Assets 1.0.0" \
  --notes-file docs/RELEASE-NOTES-1.1.0.md
```

Без `gh` — через веб-интерфейс: **Releases → Draft a new release**, тег `v1.1.0`, прикрепить те же
четыре файла. Публикация выполняется только с разрешения владельца репозитория.

## Проверка после публикации

```bash
for f in world.json world.zip module.json goldwater-assets.zip fxmaster.json fxmaster-5.0.1.zip; do
  printf '%-24s ' "$f"
  curl -sIL -o /dev/null -w '%{http_code} %{size_download}\n' \
    "https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases/latest/download/$f"
done
```

Все четыре должны отвечать `302` (редирект на файл релиза), а не `404`.

Затем в чистой установке Foundry V12: установить мир по Manifest URL, убедиться, что Foundry
предлагает поставить `goldwater-assets`, установить модуль, включить его, открыть мир, 2–3 сцены с
собственными картами, журнал с картинками и плейлист. Сцены Tom Cartos без их модулей ожидаемо
откроются без фона.

## Версии

- Модуль: `1.0.0` — первая версия, меняется при изменении состава ассетов.
- Мир: `1.1.0` — добавлена зависимость от модуля и переписаны пути к ресурсам.
