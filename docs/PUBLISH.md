# Сборка и публикация

## Инвариант релиза

В каждом релизе — все шесть файлов. Иначе `/releases/latest/download/...` начнёт отдавать 404 у
части пользователей.

| Файл | Что это | Куда попадает |
|---|---|---|
| `world.json` | манифест мира (Manifest URL мира) | Setup → Install World |
| `world.zip` | архив мира, ~152 МиБ | `Data/worlds/goldwater-cuckold/` |
| `module.json` | манифест Goldwater Assets | Setup → Install Module |
| `goldwater-assets.zip` | архив ассетов, ~1,12 ГБ | `Data/modules/goldwater-assets/` |
| `fxmaster.json` | манифест-зеркало FXMaster 5.0.1 | Setup → Install Module |
| `fxmaster-5.0.1.zip` | официальный архив FXMaster v5.0.1 без изменений | `Data/modules/fxmaster/` |

Manifest URL мира (`.../releases/latest/download/world.json`) менять нельзя — он уже прописан у
пользователей. Модуль использует `.../releases/latest/download/module.json`.

GitHub ограничивает размер одного файла релиза 2 ГБ; 1,12 ГБ проходит. ZIP не хранятся в git — они
публикуются только как ассеты релиза.

## Версии

| Пакет | Версия | Когда повышать |
|---|---|---|
| Мир `goldwater-cuckold` | **2.0.0** | меняются сцены, зависимости или настройки мира |
| `goldwater-assets` | 1.0.0 | меняется состав файлов ассетов |
| FXMaster | 5.0.1 | не повышается: это эталон снега, архив upstream неизменен |

## Сборка мира 2.0.0

Нужен bun и локальная Foundry с этим миром. **Живую Foundry закрывать не нужно, но мир не должен
быть открыт**: скрипт работает с копией.

```bash
cd tools && bun install && cd ..

# 1. копия живого мира (источник не трогаем)
cp -r "$LOCALAPPDATA/FoundryVTT/Data/worlds/goldwater-cuckold/." audit/world-src/

# 2. сборка: копирует мир, переписывает пути в модуль, включает модули,
#    объявляет зависимости, проверяет 66 сцен и эталонный снег, пишет dist/v2.0.0/
WORLD_DIR="$(pwd)/audit/world-src" bun tools/build-world.mjs

# 3. проверка архива против источника по каждой сцене
WORLD_SRC="$(pwd)/audit/world-src" bun tools/verify-v2.mjs
```

`build-world.mjs` падает, если:

- сцен не 66, записей стен меньше 17 000, дверей меньше 1 200, света меньше 2 600;
- параметры снега или облаков на `Uicwxtf2pNEmjfaS` отличаются от эталона;
- изменились `id`, `system`, `title`, `coreVersion` или список компендиумов мира;
- в `data/settings` не ровно один документ `core.moduleConfiguration`.

`verify-v2.mjs` распаковывает финальный `world.zip` и сравнивает с источником **по каждой сцене**:
имя, фон, размер, сетка, стены, двери, секретные двери, свет, токены, заметки, звуки, тайлы,
эффекты FXMaster. Плюс проверяет все ссылки на ресурсы: 0 отсутствующих в модуле, 0 абсолютных
путей, 0 старых `assets/`. Известные дефекты исходного мира (3 mp3 и 2 иконки Monk's) перечислены
в скрипте и не считаются ошибкой. Результат — `audit/verify-2.0.0.json`.

Документ со списком сцен генерируется из этого же отчёта:

```bash
bun tools/gen-scenes-doc.mjs      # docs/SCENES.md
```

## Ассеты

`goldwater-assets.zip` в 2.0.0 не менялся с 1.1.0 — это те же байты (sha256
`b8fe70d11ff1220c53e900d5eb2db08194b91472706a8a99bab42dd38616526a`). Пересобирать и заново
заливать 1,12 ГБ не нужно, но файл обязан быть в каждом релизе.

## Tom Cartos

Платные наборы в релиз не входят (см. [TOM-CARTOS.md](TOM-CARTOS.md)). Приватные сборки:

```bash
bun tools/package-tom-cartos.mjs                    # → private/tom-cartos/ (git-ignored)
TOM_CARTOS_BASE_URL="https://host/path" bun tools/package-tom-cartos.mjs
```

Каталог `private/` в `.gitignore` — не коммитить и не прикладывать к релизу.

## Публикация

```bash
gh release create v2.0.0 \
  dist/v2.0.0/world.json dist/v2.0.0/world.zip \
  dist/v2.0.0/module.json dist/goldwater-assets.zip \
  dist/v2.0.0/fxmaster.json dist/fxmaster-5.0.1.zip \
  --title "Goldwater cuckold 2.0.0 — 66 сцен, зависимости, Tom Cartos" \
  --notes-file docs/RELEASE-NOTES-2.0.0.md
```

Без `gh` — через веб-интерфейс: **Releases → Draft a new release**, тег `v2.0.0`, приложить те же
шесть файлов. Старые релизы и теги не трогать.

## Проверка после публикации

```bash
for f in world.json world.zip module.json goldwater-assets.zip fxmaster.json fxmaster-5.0.1.zip; do
  printf '%-24s ' "$f"
  curl -sIL -o /dev/null -w '%{http_code} %{size_download}\n' \
    "https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases/latest/download/$f"
done
```

Все шесть должны отвечать `302`, а не `404`. Дополнительно: скачать `world.json` и `module.json` из
`/latest/` и сверить sha256 с `dist/v2.0.0/`.

## Приёмочный тест на чистой установке

Тест выполняется на отдельном экземпляре Foundry 12.331 (другой `--dataPath`, другой порт), чтобы
не трогать рабочую Foundry:

1. `--dataPath=<temp>` + свой `Config/options.json` с портом, лицензия копируется из рабочей.
2. Setup → Install World → манифест мира.
3. Foundry открывает **Install Package Dependencies**: 3 автоматически ставимые зависимости,
   19 Tom Cartos «manually installed». Нажать **Install selected dependencies automatically**.
4. Убедиться, что мир стал доступен (availability = VERIFIED, не MISSING_DEPENDENCY).
5. Запустить мир, проверить список из 66 сцен, открыть `New York` (снег и облака), сцену Tom Cartos
   (стены и свет на месте, фон отсутствует без набора).
6. Отключить необязательный модуль в Manage Modules — мир должен продолжать работать.

Результаты теста 2.0.0 — в `docs/RELEASE-NOTES-2.0.0.md` и в ответе сопроводительного отчёта.

### Фактические результаты теста 2.0.0 (27.11.2026)

Экземпляр: Foundry VTT 12.331 build 331, отдельный `--dataPath`, порт 30123, копия лицензии, система
World of Darkness 4.2.12. Живая Foundry не использовалась.

| Проверка | Результат |
|---|---|
| Установка мира по `world.json` | установлен, версия 2.0.0 |
| Окно зависимостей | 3 автоматически (`goldwater-assets`, `fxmaster`, `monks-enhanced-journal`), 19 Tom Cartos «manually installed» |
| Автоматическая установка выбранных | оба обязательных модуля скачались и распаковались, availability мира = VERIFIED |
| Запуск мира | без ошибок, 66 сцен |
| Элементы сцен | 18 026 стен, 1 355 флагов дверей (1 253 двери + 102 секретные), 2 682 света, 70 токенов, 42 тайла, 62 заметки, 3 звука |
| Битые пути | 0 вне Tom Cartos; 78 отсутствующих текстур — только модули Tom Cartos (159 проверенных ресурсов) |
| New York `Uicwxtf2pNEmjfaS` | снег `0.3/90/0.5/5/0.8/1`, облака `1.2/90/0.6/5/0.099/1`, `tint.apply false`; FXMaster 5.0.1, 2 активных слоя эффектов |
| Отдельный модуль Tom Cartos | `tomcartosmodern-apartment-block` 1.0.5 установлен из приватного архива, появился в Add-on Modules, автоматически активен, компендиум 10 сцен, фоны 5 сцен мира отдаются 200 |
| Отключение модуля | мир загрузился, 66 сцен, ошибок нет; модуль `active: false` |
| Удаление модуля | модуль удалён из `Data/modules`, мир после перезапуска работает, 66 сцен |
