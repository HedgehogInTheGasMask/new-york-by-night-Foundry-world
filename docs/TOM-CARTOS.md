# Tom Cartos Modern: лицензия, приватная упаковка и установка

## 1. Что можно и что нельзя распространять

Проверены официальные условия Tom Cartos (на 27.11.2026):

- <https://www.tomcartos.com/commercial-licensing> — «You may not sell or give away for free any of
  my products, or any work that includes my products…», лицензия «non-transferable (you can’t
  relicense or sublicense my content to someone else)».
- <https://www.tomcartos.com/faq> — про стримы: «do not distribute the maps/assets or post high
  resolution images of them».
- <https://www.tomcartos.com/toms-open-map-license> — бесплатная коммерческая лицензия
  распространяется только на **watermarked** версии карт и Open License Asset Bundle, а не на
  платные наборы, установленные локально.

**Вывод:** приобретённые модули Tom Cartos Modern можно использовать в своих играх, но нельзя
публиковать, выкладывать в публичный GitHub, прикладывать к релизам или передавать третьим лицам.
Поэтому в релизы этого репозитория не входит ни один файл Tom Cartos: ни карты, ни `module.json`,
ни компендиумы сцен. Это осознанное ограничение, а не незавершённая работа.

Что **можно** распространять и уже распространяется: данные сцен мира (стены, двери, свет, токены,
заметки, настройки сетки), потому что это результат настройки, а не artwork. Сами изображения карт
остаются у автора и у покупателя.

## 2. Что установлено локально

19 модулей, все с автором Tom Cartos / Tom Cartos Modern:

| Module ID | Название | Версия | Сцен в компендиуме | Совместимость в оригинале |
|---|---|---|---:|---|
| `tom-cartos-modern-city-streets-01` | City Streets 01 | 1.0.1 | 12 | 11–12 |
| `tom-cartos-modern-city-streets-02` | City Streets 02 | 1.0.0 | 9 | 11–12 |
| `tom-cartos-modern-city-streets-03` | City Streets 03 | 1.0.1 | 10 | 11–12 |
| `tom-cartos-modern-downtown-nightclub` | Downtown Nightclub | 1.0.0 | 6 | 11–12 |
| `tom-cartos-modern-grand-library` | Grand Library | 1.0.1 | 9 | 11–12 |
| `tom-cartos-modern-nakatomi-plaza` | Nakatomi Plaza | 1.0.0 | 13 | **13–13** |
| `tom-cartos-modern-penthouse` | Penthouse | 1.0.1 | 4 | 11–12 |
| `tom-cartos-modern-prison` | Prison | 1.0.0 | 6 | 11–13 |
| `tom-cartos-modern-scrapyard` | Scrapyard | 1.0.0 | 6 | 11–13 |
| `tom-cartos-modern-sewers` | Sewers | 1.0.1 | 2 | 11–12 |
| `tom-cartos-modern-subway-drug-lab` | Subway Drug Lab | 1.0.0 | 4 | 11–12 |
| `tom-cartos-modern-trainyard` | Trainyard | 1.0.0 | 6 | 11–13 |
| `tom-cartos-modern-university-quad` | University Quad | 1.0.0 | 6 | 11–12 |
| `tom-cartos-modern-water-treatment-plant` | Water Treatment Plant | 1.0.1 | 9 | 11–12 |
| `tomcartosmodern-apartment-block` | Apartment Block | 1.0.5 | 10 | 9–10.291 |
| `tomcartosmodern-car-park` | Multistorey Car Park | 1.0.4 | 20 | 9–10.120 |
| `tomcartosmodern-high-school` | High School | 1.0.4 | 6 | 9–10.120 |
| `tomcartosmodern-office-block` | Office Block | 1.0.4 | 8 | 9–10.120 |
| `tomcartosmodern-subway-station` | Subway Station | 1.0.5 | 8 | 9–10.291 |

Всего 160 готовых сцен в компендиумах. Мир использует карты 18 наборов (53 сцены); Nakatomi Plaza
установлен, но в сценах мира не используется.

## 3. Приватная упаковка в отдельные модули

Скрипт `tools/package-tom-cartos.mjs` берёт установленные модули и собирает из каждого
самостоятельный пакет:

```bash
cd tools && bun install && cd ..
bun tools/package-tom-cartos.mjs
```

Результат — в `private/tom-cartos/` (каталог в `.gitignore`, в git и релизы не попадает):

```
private/tom-cartos/
├── <module-id>/                     # распакованный модуль
├── <module-id>-<version>.zip        # отдельный архив, корень <module-id>/
└── INDEX.json                       # id, версия, сцены, файлы, sha256
```

Что делает упаковщик:

- сохраняет **исходный module id** — от него зависят пути в сценах мира
  (`modules/tomcartosmodern-car-park/maps/...`), поэтому id менять нельзя;
- ставит `compatibility: { "minimum": "12", "verified": "12.331" }` — пять старых наборов
  объявляли 9–10.291, а Nakatomi — 13, из-за чего Foundry 12 считала их несовместимыми;
- **исправляет пути компендиумов**: у пяти наборов (`apartment-block`, `car-park`, `high-school`,
  `office-block`, `subway-station`) `module.json` указывал на NeDB-файлы `packs/*.db`, которые
  Foundry 12 не читает. Рядом лежат LevelDB-каталоги, созданные при миграции, — манифест теперь
  указывает на них, а `.db`-файлы в архив не попадают. Без этого компендиум сцен в Foundry 12
  открывался пустым;
- исключает `LOCK`, `LOG`, `LOG.old` и мёртвые NeDB-файлы;
- кладёт `module.json` в корень пакета и оборачивает архив в одну папку `<id>/` — установщик
  Foundry 12.331 такой архив распаковывает в `Data/modules/<id>/`;
- считает сцены и журналы по верхнеуровневым документам компендиумов (не по вложенным стенам).

Каждый модуль остаётся отдельным пакетом: его можно включить, отключить и удалить в
**Settings → Manage Modules** независимо от мира и от остальных наборов. Мир без него работает:
сцена открывается, стены и свет на месте, фон отсутствует.

### Установка на свой сервер

Вариант А — из собственной покупки (штатный путь): установите наборы в Foundry так, как вы их
получили (Patreon/Forge Bazaar), затем включите в **Manage Modules**. Мир подхватит их
автоматически: id уже прописаны в `core.moduleConfiguration`.

Вариант Б — из приватных архивов. Разложите `private/tom-cartos/<id>/` в
`Data/modules/<id>/` на сервере (SFTP/панель хостинга). Если сервер умеет отдавать файлы по HTTP,
можно сгенерировать манифесты с постоянными ссылками:

```bash
TOM_CARTOS_BASE_URL="https://ваш-сервер.example/tom-cartos" bun tools/package-tom-cartos.mjs
```

Тогда в `INDEX.json` и в каждом `module.json` появятся `manifest` и `download` вида
`…/tom-cartos/<id>/module.json` и `…/<id>/<id>-<version>.zip`, и наборы можно ставить через
**Install Module** по одному. Эти URL **не публикуйте**.

Вариант В — перенести папки вручную и не трогать манифесты: Foundry читает `module.json` из папки
модуля, поля `manifest/download` для локальной работы не обязательны.

## 4. Как мир объявляет эти модули

В `world.json` (2.0.0):

- `relationships.requires` — только `goldwater-assets` и `fxmaster`. Платные наборы туда не
  попадают: иначе мир не запустился бы ни у кого, у кого их нет, а Foundry не смогла бы их
  установить (у них нет публичного manifest URL).
- `relationships.recommends` — Monk's Enhanced Journal 12.02 и все 19 наборов Tom Cartos по id.
  При установке мира Foundry показывает их в окне зависимостей как «need to be manually
  installed» — это максимум, что позволяет сделать штатный механизм для пакетов без публичного
  манифеста.

Проверено на чистой Foundry 12.331: окно зависимостей показывает 22 зависимости, из них 3 можно
поставить автоматически (`goldwater-assets`, `fxmaster`, `monks-enhanced-journal`), остальные 19
перечислены как требующие ручной установки. Мир нельзя запустить, пока не поставлены обязательные
две; после их установки мир запускается и без Tom Cartos.

## 5. Чего в публичном релизе нет и почему

- карт, токенов и ассетов Tom Cartos (`images/`, `maps/`, `assets/`, `scenes/`);
- компендиумов сцен и журналов Tom Cartos (`packs/`);
- их `module.json` и Dropbox-ссылок на платные архивы;
- приватных zip из `private/tom-cartos/`.

Если у вас есть письменное разрешение автора на распространение — только тогда эти файлы можно
добавить в релиз, и то с указанием условий и ссылкой на разрешение.
