# Goldwater cuckold

Игровой мир для **Foundry Virtual Tabletop V12** по системе **World of Darkness**: Нью-Йорк,
Камарилья, Анархи, Шабаш, ночные клубы, особняки и подземки.

Мир состоит из двух пакетов: сам мир (`goldwater-cuckold`) и модуль с графикой и медиа
(`goldwater-assets`). Модуль объявлен обязательной зависимостью: без него Foundry не запустит мир,
а изображения не будут отображаться.

## Требования

| Компонент | Версия | Обязателен |
|---|---|---|
| Foundry VTT | 12 (целевая версия сборки — 12.331) | да |
| Система World of Darkness (`worldofdarkness`) | 4.2.12 | да |
| Модуль Goldwater Assets (`goldwater-assets`) | 1.0.0 | да |
| Monk's Enhanced Journal (`monks-enhanced-journal`) | 12.x | рекомендуется |
| Модуль FXMaster (`fxmaster`) | **5.0.1** | для снега и облаков на сцене «New York» |

Сборка подготовлена под Foundry VTT 12.331, но приёмочный тест на чистой установке ещё не
проводился — порядок проверки описан в [docs/QA-CHECKLIST.md](docs/QA-CHECKLIST.md).

## Установка

1. Установите систему **World of Darkness** 4.2.12 (Setup → Game Systems → Install System).
2. Setup → **Game Worlds** → **Install World**, вставьте Manifest URL:

   ```
   https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases/latest/download/world.json
   ```

3. Установите модуль ассетов: Setup → **Add-on Modules** → **Install Module**, Manifest URL:

   ```
   https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases/latest/download/module.json
   ```

   Архив модуля — около **1,12 ГБ** (1070 МиБ; карты, портреты, музыка в исходном качестве).

4. Запустите мир. Если модуль ещё не установлен, Foundry сама предложит его поставить —
   зависимость объявлена в манифесте мира. После установки включите модуль в
   **Settings → Manage Modules → Goldwater Assets**.

Мир можно установить и до модуля: он объявляет `goldwater-assets` как обязательную зависимость,
поэтому Foundry попросит доустановить её перед первым запуском.

### Снег и облака (FXMaster 5.0.1)

Сцена **New York** `Uicwxtf2pNEmjfaS` рисует снег и облака модулем **FXMaster 5.0.1**. Версии 7.x
и 8.x рисуют тот же эффект другим кодом (в 8.3.0 снег переписан на шейдер, `density` нормализован
с 7.2.0), поэтому при тех же параметрах сцены картинка получается другой. Установка одной ссылкой из
этого репозитория — Setup → Add-on Modules → Install Module:

```
https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases/latest/download/fxmaster.json
```

Это ссылка на неизменённый официальный архив v5.0.1. Эталонные параметры сцены, проверка и откат —
[docs/FXMASTER-SNOW.md](docs/FXMASTER-SNOW.md).

## Что внутри модуля

```
Data/modules/goldwater-assets/
├── module.json
├── assets/    # портреты, токены, карты, журнальные картинки, музыка, видео
├── world/     # изображения страниц журналов и превью сцен из папки мира
└── modules/   # два файла, которые раньше лежали прямо в Data/modules/
```

Структура повторяет исходную, файлы не пережимались и не переименовывались. Всё, на что ссылаются
документы мира, лежит в модуле: 347 файлов, 0 неиспользуемых, 0 конфликтов имён.

Архив модуля устроен как `goldwater-assets/module.json` в корне. Установщик Foundry 12.331 находит
вложенный манифест, запоминает его папку и распаковывает архив с удалением этого префикса, поэтому
после установки файлы оказываются ровно в `Data/modules/goldwater-assets/`, без лишней вложенности.

## Сторонние модули

Часть сцен использует карты из платных модулей **Tom Cartos Modern** (18 модулей, 122 файла).
Эти материалы **не входят** в релиз и не могут в него входить: они распространяются автором по
подписке <https://www.patreon.com/tcmodern>. Если модулей нет, соответствующие сцены откроются без
фона, но данные, токены, стены и свет останутся целыми.

| Модуль | Module ID | Ресурсов |
|---|---|---:|
| Tom Cartos Modern — Sewers | `tom-cartos-modern-sewers` | 26 |
| Tom Cartos — Multistorey Car Park | `tomcartosmodern-car-park` | 10 |
| Tom Cartos Modern — Apartment Block | `tomcartosmodern-apartment-block` | 10 |
| Tom Cartos — Office Block | `tomcartosmodern-office-block` | 8 |
| Tom Cartos Modern — City Streets 02 | `tom-cartos-modern-city-streets-02` | 7 |
| Tom Cartos Modern — University Quad | `tom-cartos-modern-university-quad` | 6 |
| Tom Cartos — High School | `tomcartosmodern-high-school` | 6 |
| Tom Cartos Modern — Grand Library | `tom-cartos-modern-grand-library` | 6 |
| Tom Cartos Modern — Water Treatment Plant | `tom-cartos-modern-water-treatment-plant` | 6 |
| Tom Cartos Modern — Prison | `tom-cartos-modern-prison` | 6 |
| Tom Cartos Modern — City Streets 03 | `tom-cartos-modern-city-streets-03` | 5 |
| Tom Cartos Modern — Downtown Nightclub | `tom-cartos-modern-downtown-nightclub` | 4 |
| Tom Cartos Modern — Trainyard | `tom-cartos-modern-trainyard` | 4 |
| Tom Cartos Modern — Subway Drug Lab | `tom-cartos-modern-subway-drug-lab` | 4 |
| Tom Cartos Modern — Subway Station | `tomcartosmodern-subway-station` | 4 |
| Tom Cartos Modern — Scrapyard | `tom-cartos-modern-scrapyard` | 4 |
| Tom Cartos Modern — Penthouse | `tom-cartos-modern-penthouse` | 3 |
| Tom Cartos Modern — City Streets 01 | `tom-cartos-modern-city-streets-01` | 3 |
| Monk's Enhanced Journal | `monks-enhanced-journal` | 2 |

Manifest URL каждого модуля, список зависящих от него сцен и порядок установки — в
[docs/ASSETS-REPORT.md](docs/ASSETS-REPORT.md), раздел 6. Эти модули не объявлены зависимостями
мира намеренно: они платные, их Dropbox-манифесты могут быть отозваны, а `requires` не дал бы
запустить мир без них. Ставить их нужно вручную, по одному, тем же способом (Install Module →
Manifest URL).

`monks-enhanced-journal` объявлен в `relationships.recommends`: он бесплатный, ставится с GitHub и
нужен только для иконок страниц журналов.

## Известные ограничения

- Три дорожки плейлистов (`Maenad Veyl — Out of Sight`, `Maenad Veyl — Unhealed`,
  `Knights & Bishops`) ссылаются на файлы, которых нет в исходной папке мира. Ссылки оставлены как
  есть, заглушки не создавались.
- Две иконки Monk's Enhanced Journal (`assets/text.png`, `assets/video.png`) отсутствуют в самом
  модуле версии 12.02 — это его внутренние файлы, к миру они не относятся.
- Девять изображений в журналах — внешние ссылки (imgur, tenor, reddit, userapi, ko-fi); без
  интернета они не загрузятся.

## Обновление

Manifest URL не меняется. Setup → **Update** у мира и у модуля. Порядок не важен, удобнее сначала
обновить Goldwater Assets.

## Релизы

Все сборки — в разделе [Releases](https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases).
В каждом релизе обязательны все четыре файла:

- `world.json` — манифест мира;
- `world.zip` — архив мира (~160 МБ, 152 МиБ);
- `module.json` — манифест модуля ассетов;
- `goldwater-assets.zip` — архив модуля (~1,12 ГБ, 1070 МиБ).

Правила выпуска и команды — [docs/PUBLISH.md](docs/PUBLISH.md).

## Права

Права на исходные изображения, музыку и карты принадлежат их авторам. В репозитории лежит только
то, что относилось к этому миру; материалы сторонних коммерческих модулей в него не включены.
