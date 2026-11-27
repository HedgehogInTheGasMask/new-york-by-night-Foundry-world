# Goldwater cuckold — аудит ресурсов и отчёт о проверках

Отчёт сформирован скриптом `tools/report.mjs` из данных `audit/*.json`. Все цифры получены
автоматически: аудит живого мира → план переноса → сборка модуля и мира → проверки → имитация
чистой установки.

## 1. Сводка

| Показатель | Значение |
|---|---|
| Записей LevelDB в мире и компендиумах | 25999 → 25999 |
| JSON-документов | 25920 |
| Переписано значений (только пути) | 435 |
| Уникальных путей к ресурсам | 518 |
| Файлов в модуле (без `module.json`) | 347 |
| Объём модуля (распакованный) | 1069.9 МиБ |
| Размер `goldwater-assets.zip` | 1070.0 МиБ |
| Размер `world.zip` | 152.2 МиБ |
| Ссылок внутрь модуля в собранном мире | 678 |
| Ссылок на старые локальные пути | 0 |
| Неиспользуемых файлов в модуле | 0 |
| Дубликатов по SHA-256 | 18 групп |

## 2. Что проверялось

Все LevelDB-коллекции игрового мира и четырёх компендиумов:

| Хранилище | Записей | Документов | Ошибок разбора |
|---|---:|---:|---:|
| `data/actors` | 2799 | 2799 | 0 |
| `data/cards` | 0 | 0 | 0 |
| `data/combats` | 0 | 0 | 0 |
| `data/fog` | 13 | 13 | 0 |
| `data/folders` | 48 | 48 | 0 |
| `data/items` | 8 | 8 | 0 |
| `data/journal` | 52 | 52 | 0 |
| `data/macros` | 2 | 2 | 0 |
| `data/messages` | 431 | 431 | 0 |
| `data/playlists` | 58 | 58 | 0 |
| `data/scenes` | 21125 | 21125 | 0 |
| `data/settings` | 42 | 42 | 0 |
| `data/tables` | 0 | 0 | 0 |
| `data/users` | 11 | 11 | 0 |
| `packs/characters` | 913 | 902 | 0 |
| `packs/discipliny` | 440 | 380 | 0 |
| `packs/fakty-biografii` | 15 | 15 | 0 |
| `packs/oruzhiebronya` | 42 | 34 | 0 |
| **всего** | **25999** | **25920** | **0** |

Сканировались не только очевидные поля: обходились все строковые значения документов —
`img`, `texture.src`, `background.src`, `icon`, `thumb`, `flags`, HTML-содержимое журналов,
`path` плейлистов и вложенные объекты. Из них извлечено 5101 ссылок;
421 обрывков (хвосты длинных путей, разрезанных пробелом в HTML) отброшено
после сверки с полными путями, осталось 518 уникальных путей.

## 3. Состав модуля по категориям

| Категория | Файлов | Объём, МиБ | Используется | Не используется |
|---|---:|---:|---:|---:|
| Музыка | 50 | 828.1 | 50 | 0 |
| Карты и фоны сцен | 10 | 80.3 | 10 | 0 |
| Видео | 5 | 65.2 | 5 | 0 |
| Изображения журналов | 47 | 45.8 | 47 | 0 |
| Портреты персонажей | 110 | 31.8 | 110 | 0 |
| Прочие изображения | 43 | 9.3 | 43 | 0 |
| Токены | 60 | 8.5 | 60 | 0 |
| Документы (PDF) | 1 | 0.8 | 1 | 0 |
| Превью сцен | 21 | 0.1 | 21 | 0 |
| **всего** | **347** | **1069.9** | **347** | **0** |

Категория определяется по тому, в каком поле документ ссылается на файл (фон сцены → карты и фоны,
`prototypeToken`/`texture` → токены, `img` актёра → портрет, страница журнала → изображение журнала,
тип файла → музыка/видео/PDF). Один файл может использоваться в нескольких полях — он отнесён к
основной категории.

### Крупнейшие файлы

| Файл | МиБ |
|---|---:|
| `assets/worldofdarkness/goldwater-cuckold/new-york/карта Нью-Йорк.png` | 29.9 |
| `assets/worldofdarkness/goldwater-cuckold/16815884014850.mp4` | 29.8 |
| `assets/worldofdarkness/goldwater-cuckold/new-york/OST/city-sounds/City Sounds 1.mp3` | 22.9 |
| `assets/worldofdarkness/goldwater-cuckold/new-york/OST/city-sounds/City Sounds 10.mp3` | 22.4 |
| `assets/worldofdarkness/goldwater-cuckold/new-york/OST/city-sounds/City Sounds 11.mp3` | 22.4 |
| `assets/worldofdarkness/goldwater-cuckold/new-york/OST/city-sounds/City Sounds 12.mp3` | 22.4 |
| `assets/worldofdarkness/goldwater-cuckold/new-york/OST/city-sounds/City Sounds 13.mp3` | 22.4 |
| `assets/worldofdarkness/goldwater-cuckold/new-york/OST/city-sounds/City Sounds 14.mp3` | 22.4 |
| `assets/worldofdarkness/goldwater-cuckold/new-york/OST/city-sounds/City Sounds 15.mp3` | 22.4 |
| `assets/worldofdarkness/goldwater-cuckold/new-york/OST/city-sounds/City Sounds 16.mp3` | 22.4 |

### Дубликаты и служебные файлы

- Групп идентичных файлов по SHA-256: **18**, избыточный объём 0.3 МиБ.
  - `assets/worldofdarkness/goldwater-cuckold/RURIK RAKOCZY_token.png`, `assets/worldofdarkness/goldwater-cuckold/tokens-new-york/Рюрик Ракоши4.png` — по 0.1 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Brujah.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Brujah-N1QobTgm84IZy9Xi.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Elysium.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Elysium-rP8UmXIiG8ZUR3bI.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Salubri.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Salubri-UvZAJA4MLiRwNdpI.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/Neutral.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-Neutral-xQdFhm1DUU3GPXIF.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Assamites.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Assamites-2liXTLcQEzpSuxVY.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Malkavian.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Malkavian-YtiSpdSBMtmHacTJ.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Nosferatu1.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Nosferatu1-Okg5WLVa8SgyDUvs.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Followers of Set.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Followers of Set-hlWnfuAGmj4bG4pw.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Gangrel.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Gangrel-UwcqtkGKEDDOu2gS.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Tremere1.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Tremere1-XKPG6TMjiIUfrLnG.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Lasmobra.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Lasmobra-vy21T43ahzVivHvk.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Toreador.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Toreador-goPz1AR6UKyMKb1a.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Thin Blooded.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Thin Blooded-esvFsRIloXOAK4ma.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Ventrue.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Ventrue-rx4RTNkxXAW4oSLR.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Anarchs.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Anarchs-Bqd42ZgextmFUwWh.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Camarilla.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Camarilla-PRD9adsB9kSbp4Te.png` — по 0.0 МиБ
  - `assets/worldofdarkness/goldwater-cuckold/new-york/journals/2Logo Independent clan.png`, `world/assets/pages/laWuvr1zlW6iAIyt-pages-pYo92aO6l2xsTzOT-2Logo Independent clan-OV2nA8pu4XQmcY43.png` — по 0.0 МиБ
- Служебные, временные и исходные файлы (`.psd`, `.txt`, `.bak`, `Thumbs.db` и подобные): **0**.
  - не найдено.
- Неиспользуемых файлов в модуле: **0** — в архив попадает только то, на что ссылаются документы.
- В `world.zip` намеренно оставлена копия исходной папки мира `assets/` (81 файлов, 29.6 МиБ), из них 74 файлов (17.5 МиБ) совпадают с модулем побайтово. Это страховка для старых макросов и прямых путей; на размер мира она влияет незначительно.

## 4. Куда указывали ресурсы и что с ними сделано

| Источник | Уникальных путей | Решение |
|---|---:|---|
| Локальная папка `Data/assets/` (портреты, токены, карты, музыка, видео) | 293 | перенесено в модуль |
| Папка мира (`worlds/goldwater-cuckold/assets/` — страницы журналов, превью сцен) | 46 | перенесено в модуль |
| Локальный модуль `haunted-estate-battlemap` (собственные карты, без репозитория) | 6 | перенесено в модуль |
| Файлы, лежавшие прямо в `Data/modules/` | 2 | перенесено в модуль |
| Система World of Darkness (`systems/worldofdarkness/...`) | 28 | не трогали — приходит с системой |
| Иконки и звуки Foundry (`icons/`, `sounds/`, `ui/`, `fonts/`) | 7 | не трогали — приходит с Foundry |
| Сторонние модули (Tom Cartos Modern, Monk's Enhanced Journal) | 122 | не включены — см. раздел 6 |
| Файлы сторонних модулей, которых нет даже в установленной версии | 2 | не подменялись — см. раздел 7 |
| Внешние ссылки (imgur, tenor, reddit, userapi) | 9 | не трогали — грузятся из интернета |
| Относительные пути без корня, файлов нет ни в одной папке | 3 | не подменялись — см. раздел 7 |

Структура модуля повторяет исходное расположение файлов, поэтому сопоставление путей однозначно:

| Было (в `Data/`) | Стало (в мире) |
|---|---|
| `assets/...` | `modules/goldwater-assets/assets/...` |
| `worlds/goldwater-cuckold/assets/...` | `modules/goldwater-assets/world/assets/...` |
| `modules/haunted-estate-battlemap/...` | `modules/goldwater-assets/assets/modules/haunted-estate-battlemap/...` |
| `modules/OIG4.png`, `modules/report_event_SGR_RND_2.png` | `modules/goldwater-assets/modules/...` |

## 5. Проверки

### Целостность мира

| Проверка | Результат |
|---|---|
| Записей до / после | 25999 / 25999 |
| Ключи LevelDB сохранены | да, потерь нет |
| JSON-документы разбираются | 25920, ошибок 0 |
| Изменённые значения | 435 |
| Обратная замена путей даёт исходный байт-в-байт документ | да, расхождений 0 |
| `id`, `system`, `title`, `coreVersion` мира | не изменены |

Обратная проверка: каждое изменённое значение сравнивается с исходным документом после замены
новых путей на старые. Совпадение означает, что в документах не изменилось ничего, кроме путей к
ресурсам.

### Ссылки в собранном мире

| Категория | Ссылок |
|---|---:|
| Ведут в модуль Goldwater Assets, все файлы существуют | 678 |
| Система World of Darkness | 4639 |
| Ядро Foundry | 740 |
| Сторонние модули | 126 |
| Внешние URL | 1990 |
| Старые локальные пути (`assets/`, `worlds/goldwater-cuckold/`) | 0 |
| Известные отсутствующие файлы (были сломаны до работы) | 3 |

Регистр имён сверяется точно (Foundry на Linux регистрозависим): расхождений — 0.

### Архивы

| Проверка | `goldwater-assets.zip` | `world.zip` |
|---|---|---|
| Файлов | 348 | 261 |
| Размер, МиБ | 1070.0 | 152.2 |
| Корень | `goldwater-assets/module.json` | `world.json` |
| Не-ASCII имена с UTF-8 флагом | 107 / 109 | 8 / 8 |
| Проверка CRC при распаковке | пройдена | пройдена |
| Проблемы структуры | 0 | — |

Структура архивов сверена с установщиком Foundry 12.331 (build 331): если манифеста нет в корне
архива, установщик сам находит вложенный `module.json`, вычисляет его папку и распаковывает архив с
удалением этого префикса. Поэтому `goldwater-assets/module.json` в корне архива — поддерживаемый
вариант: после установки содержимое оказывается в `Data/modules/goldwater-assets/`. У мира
`world.json` лежит прямо в корне, поэтому распаковка идёт без удаления префикса в
`Data/worlds/goldwater-cuckold/`.

## 6. Сторонние модули

Эти ресурсы принадлежат другим авторам и **не входят** в релиз. Ниже — что именно используется,
какие сцены пострадают и как получить модуль.

| Модуль | Module ID | Manifest | Ресурсов | Зависимые сцены и документы | Получение | Вручную |
|---|---|---|---:|---|---|---|
| Tom Cartos Modern - Sewers | `tom-cartos-modern-sewers` | [module.json](https://www.dropbox.com/scl/fi/gldosy2on7ym91tiaa3xy/module.json?rlkey=f7xfcx5n2k8oi2nhrijtcxb03&st=a684eild&dl=1) | 26 | Канализация - Туннели | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos – Multistorey Car Park | `tomcartosmodern-car-park` | [module.json](https://www.dropbox.com/scl/fi/pl71a9x6g7jfgeakfhl3j/module.json?rlkey=eh2u1xz92206awrmxltegtl2d&dl=1) | 10 | Парковка этаж 3; Парковка этаж 5; Парковка этаж 4; Парковка этаж 2 … (+1) | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern – Apartment Block | `tomcartosmodern-apartment-block` | [module.json](https://www.dropbox.com/s/8yee42oevavv9p3/module.json?dl=1) | 10 | Крыша; Жилые помещения; Вестибюль; Подземная парковка … (+1) | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos – Office Block | `tomcartosmodern-office-block` | [module.json](https://www.dropbox.com/scl/fi/k8iljzaopl9grdc09zty0/module.json?rlkey=zmgn1ijc1nohpdsadk8y7qoju&dl=1) | 8 | Офис 2 этаж; Музей; Офис 3 этаж; Офис 4 этаж | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern - City Streets 02 | `tom-cartos-modern-city-streets-02` | [module.json](https://www.dropbox.com/scl/fi/t96c7445enx1l3kde894p/module.json?rlkey=1x120vxbaav5cxnphlqsahfvk&st=eq4qv5qh&dl=1) | 7 | Улица 2; Скейт парк; Улица 3; Крыши | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern - University Quad | `tom-cartos-modern-university-quad` | [module.json](https://www.dropbox.com/scl/fi/wj2cj6xbbrhiey7odytnv/module.json?rlkey=v3ljo8gs9jakdtyk1swgv1y7s&st=y4ozht3y&dl=1) | 6 | Бернард Колледж блок 1 этаж 2; Бернард Колледж блок 1 крыша; Бернард Колледж блок 1 этаж 1 | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos – High School | `tomcartosmodern-high-school` | [module.json](https://www.dropbox.com/scl/fi/wrg7rw8mvyelauhenx1jn/module.json?rlkey=zcbk9vplnuegu0175ffynpohb&dl=1) | 6 | Бернард Колледж блок 2 этаж 2; Бернард Колледж блок 2 крыша; Бернард Колледж блок 2 этаж 1 | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern - Grand Library | `tom-cartos-modern-grand-library` | [module.json](https://www.dropbox.com/scl/fi/5jbkcmhxbteda8jfh35bn/module.json?rlkey=wulti45t3jy8ozvy37p9meg52&st=akudqej1&dl=1) | 6 | Библиотека крыша; Библиотека этаж 1; Библиотека этаж 2 | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern - Water Treatment Plant | `tom-cartos-modern-water-treatment-plant` | [module.json](https://www.dropbox.com/scl/fi/qtg04nzhvv1grixjgz9w4/module.json?rlkey=k7iygsft8aortc1srgc0whk3d&st=n81agfah&dl=1) | 6 | Water Treatment Plant 03 Roof; Канализация - Дренаж; Резервуары | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern - Prison | `tom-cartos-modern-prison` | [module.json](https://www.dropbox.com/scl/fi/xnlv31o52ew3c2is5pq88/module.json?rlkey=m76s8kcd80vpn6vc54zruzwxd&st=52icvuy8&dl=1) | 6 | Тюрьма этаж 2; Тюрьма этаж 3; Тюрьма этаж 1 | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern - City Streets 03 | `tom-cartos-modern-city-streets-03` | [module.json](https://www.dropbox.com/scl/fi/h9x640bu24v8ugdu142nv/module.json?rlkey=6umt688so7cuaudj7ez7j0d09&st=ubpmh7qk&dl=1) | 5 | Мост; Парк; Стоки | платно, Patreon Tom Cartos Modern | да |
| Monk's Enhanced Journal | `monks-enhanced-journal` | [module.json](https://github.com/ironmonk88/monks-enhanced-journal/releases/latest/download/module.json) | 2 | Убежище Генри Чапмана; Записи по правилам; Убежище Дезмонда; Нью-Йорк | бесплатно, GitHub Releases | нет (рекомендация) |
| Tom Cartos Modern - Downtown Nightclub | `tom-cartos-modern-downtown-nightclub` | [module.json](https://www.dropbox.com/scl/fi/m1bj2j8dwx91srjxv39lc/module.json?rlkey=on0qls9b0rmi79scjffo3mxwc&st=mn2dfyeg&dl=1) | 4 | Клуб крыша; Клуб Ecliptic | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern - Trainyard | `tom-cartos-modern-trainyard` | [module.json](https://www.dropbox.com/scl/fi/2df6m1kqdccroigqcruvx/module.json?rlkey=lpk0cbjks2mmi5jcwndukn2zq&st=fvzaezhz&dl=1) | 4 | Железнодорожное депо; Железнодорожное депо крыша | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern - Subway Drug Lab | `tom-cartos-modern-subway-drug-lab` | [module.json](https://www.dropbox.com/scl/fi/30e0k4kz1uy93jnn0nnnp/module.json?rlkey=s1atdqw1ah4pqzisbsx1laxut&dl=1) | 4 | Подземные коммуникации; Убежище | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern – Subway Station | `tomcartosmodern-subway-station` | [module.json](https://www.dropbox.com/s/ips2hy34dgj3hga/module.json?dl=1) | 4 | Вокзал; Станция метро пустая; Вокзал крыша; Станция метро | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern - Scrapyard | `tom-cartos-modern-scrapyard` | [module.json](https://www.dropbox.com/scl/fi/3zds5hl9qbnfpl2mlff4e/module.json?rlkey=j2koqx9pzbq8sn62h5zwvott1&st=o3ay9pwi&dl=1) | 4 | Свалка крыша; Свалка | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern - Penthouse | `tom-cartos-modern-penthouse` | [module.json](https://www.dropbox.com/scl/fi/ozsnwo8k4ciguiq7x8oie/module.json?rlkey=r7hms8lkhv7xlyai4iwkci8t5&st=yyjjj85h&dl=1) | 3 | Мэдисон-сквер-гарден - конференц зал; Мэдисон-сквер-гарден крыша | платно, Patreon Tom Cartos Modern | да |
| Tom Cartos Modern - City Streets 01 | `tom-cartos-modern-city-streets-01` | [module.json](https://www.dropbox.com/scl/fi/48xwcc0md1wfwm4mglq8i/module.json?rlkey=kqjr1vn2437yvbm475ufr8u67&dl=1) | 3 | Переулок; Улица | платно, Patreon Tom Cartos Modern | да |

На карты Tom Cartos приходится 122 путей; без этих модулей
соответствующие сцены откроются без фонового изображения, но данные, токены, стены и свет останутся
целыми. Приобретать их нужно у автора: <https://www.patreon.com/tcmodern>.

### Почему они не объявлены зависимостями мира

- Это платный сторонний контент: манифест мира — публичный документ, и вписывать в него ссылки на
  распространение чужих карт нельзя.
- Их манифесты размещены на Dropbox со ссылками вида `?rlkey=...`, которые автор может отозвать.
  Зависимость в постоянном манифесте мира сломается вместе со ссылкой.
- В `relationships.requires` Foundry не даст запустить мир, пока пакет не установлен. Пользователь
  без подписки Patreon оказался бы с неработающим миром.
- Часть установленных версий объявляет совместимость только до Foundry 10/13
  (например, `tomcartosmodern-*` — `verified: 10.x`).

Единственная сторонняя зависимость, объявленная в манифесте, — бесплатный
`monks-enhanced-journal` (стабильный GitHub-манифест, проверен на V12). Она добавлена в
`relationships.recommends`: Foundry предложит её установить, но не заблокирует мир.

### Манифесты для ручной установки

```
tom-cartos-modern-sewers
https://www.dropbox.com/scl/fi/gldosy2on7ym91tiaa3xy/module.json?rlkey=f7xfcx5n2k8oi2nhrijtcxb03&st=a684eild&dl=1

tomcartosmodern-car-park
https://www.dropbox.com/scl/fi/pl71a9x6g7jfgeakfhl3j/module.json?rlkey=eh2u1xz92206awrmxltegtl2d&dl=1

tomcartosmodern-apartment-block
https://www.dropbox.com/s/8yee42oevavv9p3/module.json?dl=1

tomcartosmodern-office-block
https://www.dropbox.com/scl/fi/k8iljzaopl9grdc09zty0/module.json?rlkey=zmgn1ijc1nohpdsadk8y7qoju&dl=1

tom-cartos-modern-city-streets-02
https://www.dropbox.com/scl/fi/t96c7445enx1l3kde894p/module.json?rlkey=1x120vxbaav5cxnphlqsahfvk&st=eq4qv5qh&dl=1

tom-cartos-modern-university-quad
https://www.dropbox.com/scl/fi/wj2cj6xbbrhiey7odytnv/module.json?rlkey=v3ljo8gs9jakdtyk1swgv1y7s&st=y4ozht3y&dl=1

tomcartosmodern-high-school
https://www.dropbox.com/scl/fi/wrg7rw8mvyelauhenx1jn/module.json?rlkey=zcbk9vplnuegu0175ffynpohb&dl=1

tom-cartos-modern-grand-library
https://www.dropbox.com/scl/fi/5jbkcmhxbteda8jfh35bn/module.json?rlkey=wulti45t3jy8ozvy37p9meg52&st=akudqej1&dl=1

tom-cartos-modern-water-treatment-plant
https://www.dropbox.com/scl/fi/qtg04nzhvv1grixjgz9w4/module.json?rlkey=k7iygsft8aortc1srgc0whk3d&st=n81agfah&dl=1

tom-cartos-modern-prison
https://www.dropbox.com/scl/fi/xnlv31o52ew3c2is5pq88/module.json?rlkey=m76s8kcd80vpn6vc54zruzwxd&st=52icvuy8&dl=1

tom-cartos-modern-city-streets-03
https://www.dropbox.com/scl/fi/h9x640bu24v8ugdu142nv/module.json?rlkey=6umt688so7cuaudj7ez7j0d09&st=ubpmh7qk&dl=1

monks-enhanced-journal
https://github.com/ironmonk88/monks-enhanced-journal/releases/latest/download/module.json

tom-cartos-modern-downtown-nightclub
https://www.dropbox.com/scl/fi/m1bj2j8dwx91srjxv39lc/module.json?rlkey=on0qls9b0rmi79scjffo3mxwc&st=mn2dfyeg&dl=1

tom-cartos-modern-trainyard
https://www.dropbox.com/scl/fi/2df6m1kqdccroigqcruvx/module.json?rlkey=lpk0cbjks2mmi5jcwndukn2zq&st=fvzaezhz&dl=1

tom-cartos-modern-subway-drug-lab
https://www.dropbox.com/scl/fi/30e0k4kz1uy93jnn0nnnp/module.json?rlkey=s1atdqw1ah4pqzisbsx1laxut&dl=1

tomcartosmodern-subway-station
https://www.dropbox.com/s/ips2hy34dgj3hga/module.json?dl=1

tom-cartos-modern-scrapyard
https://www.dropbox.com/scl/fi/3zds5hl9qbnfpl2mlff4e/module.json?rlkey=j2koqx9pzbq8sn62h5zwvott1&st=o3ay9pwi&dl=1

tom-cartos-modern-penthouse
https://www.dropbox.com/scl/fi/ozsnwo8k4ciguiq7x8oie/module.json?rlkey=r7hms8lkhv7xlyai4iwkci8t5&st=yyjjj85h&dl=1

tom-cartos-modern-city-streets-01
https://www.dropbox.com/scl/fi/48xwcc0md1wfwm4mglq8i/module.json?rlkey=kqjr1vn2437yvbm475ufr8u67&dl=1
```

## 7. Отсутствующие файлы

### 7.1 Музыкальные дорожки (3)

- `new%20york/OST/battle%20themes/Maenad%20Veyl%20-%20Out%20of%20Sight.mp3` — плейлист «Maenad Veyl Out Of Sight»
- `new%20york/OST/battle%20themes/Maenad%20Veyl%20-%20Unhealed%20%5BB1GF2gT3Ek8%5D.mp3` — плейлист «Maenad Veyl Unhealed [b1gf2gt3ek8]»
- `new%20york/OST/battle%20themes/Knights%20%26%20Bishops.mp3` — плейлист «Knights & Bishops»

Проверено: в `Data` нет ни одного mp3 с такими именами (всего 64 mp3, поиск по «Maenad», «Unhealed»,
«Out of Sight», «Knights» не дал совпадений). Папка `assets/worldofdarkness/goldwater-cuckold/new-york/OST/battle-themes`
существует, но содержит другие три трека (`Destiny`, `Simon Says Instrumental`, `SLYRAX - CONTACT`),
а в плейлистах путь записан как `new york/OST/battle themes/...` — с пробелами вместо дефисов и без корня.
Даже при исправлении пути файлов с нужными именами нет. Ссылки оставлены как есть, заглушки не создавались.

### 7.2 Иконки Monk's Enhanced Journal (2)

- `modules/monks-enhanced-journal/assets/video.png` — Убежище Генри Чапмана
- `modules/monks-enhanced-journal/assets/text.png` — Записи по правилам, Убежище Дезмонда, Нью-Йорк

В установленной версии 12.02 этих файлов нет (в `assets/` лежат `encounter.png`, `person.png`,
`quest.png` и другие, но не `text.png`/`video.png`). Это поля `flags.monks-enhanced-journal.img`
в журналах; без файла иконка страницы не отображается, текст журнала не страдает. Файлы не
подменялись: это данные стороннего модуля, а не мира.

### 7.3 Внешние ссылки (9)

- `https://i.imgur.com/lvE1Qo3.png`
- `https://i.imgur.com/tB78XRr.gif`
- `https://ko-fi.com/img/githubbutton_sm.svg`
- `https://media1.tenor.com/m/b5_-Cii-wQMAAAAd/petergriffin-work.gif`
- `https://media1.tenor.com/m/dgiOqioH29wAAAAd/thukuna-sukuna.gif`
- `https://media1.tenor.com/m/n0UIJnuqTm4AAAAd/pretty-derby-kick-uma-musume.gif`
- `https://media1.tenor.com/m/u0q2Uqf_jKQAAAAd/yes-the.gif`
- `https://preview.redd.it/z5r42o63rh871.png`
- `https://psv4.userapi.com/c909518/u160316218/docs/d7/c08db65ba4af/12312edwa.png`

Эти изображения грузятся из интернета; в офлайне их не будет, но к комплекту они не относятся.

## 8. Имитация чистой установки

Архивы распакованы в пустой `Data` (модуль — в `modules/goldwater-assets`, мир — в
`worlds/goldwater-cuckold`), проверены CRC, манифесты и все ссылки. Система и ядро считаются
установленными отдельно — их файлы в комплект не входят.

| Группа | Что это | Ссылок |
|---|---|---:|
| A | Ресурсы в Goldwater Assets + система World of Darkness + ядро | 6332 |
| B | Сторонние модули (19 шт.) | 126 |
| C | Отсутствующие файлы | 3 |

Разрешение ссылок: `565` из `6461` ведут в модуль и
существуют на диске. Всё остальное — система, ядро, сторонние модули и 3
известных отсутствующих файлов.

### Группа B — по модулям

| Module ID | Ссылок | Уникальных путей | Установлен в исходной среде |
|---|---:|---:|---|
| `tom-cartos-modern-sewers` | 26 | 26 | да |
| `tomcartosmodern-car-park` | 10 | 10 | да |
| `tomcartosmodern-apartment-block` | 10 | 10 | да |
| `tomcartosmodern-office-block` | 8 | 8 | да |
| `tom-cartos-modern-city-streets-02` | 7 | 7 | да |
| `tom-cartos-modern-university-quad` | 6 | 6 | да |
| `tomcartosmodern-high-school` | 6 | 6 | да |
| `tom-cartos-modern-grand-library` | 6 | 6 | да |
| `tom-cartos-modern-water-treatment-plant` | 6 | 6 | да |
| `tom-cartos-modern-prison` | 6 | 6 | да |
| `tom-cartos-modern-city-streets-03` | 5 | 5 | да |
| `monks-enhanced-journal` | 4 | 2 | да |
| `tom-cartos-modern-downtown-nightclub` | 4 | 4 | да |
| `tom-cartos-modern-trainyard` | 4 | 4 | да |
| `tom-cartos-modern-subway-drug-lab` | 4 | 4 | да |
| `tomcartosmodern-subway-station` | 4 | 4 | да |
| `tom-cartos-modern-scrapyard` | 4 | 4 | да |
| `tom-cartos-modern-penthouse` | 3 | 3 | да |
| `tom-cartos-modern-city-streets-01` | 3 | 3 | да |

### Группа C — отсутствующие файлы

- `new york/OST/battle themes/Maenad Veyl - Out of Sight.mp3` — Maenad Veyl Out Of Sight
- `new york/OST/battle themes/Maenad Veyl - Unhealed [B1GF2gT3Ek8].mp3` — Maenad Veyl Unhealed [b1gf2gt3ek8]
- `new york/OST/battle themes/Knights & Bishops.mp3` — Knights & Bishops

## 9. Вердикт по проверкам

Все автоматические проверки пройдены: сборка, архивы и имитация установки без расхождений.

Известные дефекты исходного мира (ссылок: 3) перечислены в разделе 7 и не
являются дефектами сборки: файлов не было до переноса, они не подменялись.

## 10. Как воспроизвести

```bash
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
```
