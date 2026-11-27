# Сцены мира

Всего сцен: **66**. Таблица построена из финального архива `world.zip` релиза 2.0.0
(`tools/verify-v2.mjs`), а не из локального мира: числа стен, дверей, света, токенов и заметок
считаны по записям LevelDB внутри архива.

Стены, двери, освещение, токены, заметки, звуки и тайлы сохранены один в один: сравнение с локальным
миром по каждой сцене проходит без расхождений (`problems: []`).

| Показатель | Значение |
|---|---:|
| Сцен | 66 |
| Записей стен | 18026 |
| Из них дверей | 1253 |
| Из них секретных дверей | 102 |
| Источников света | 2682 |
| Токенов | 70 |
| Заметок | 62 |
| Звуков сцены | 3 |
| Тайлов | 42 |

## Источники карт

| Источник | Сцен |
|---|---:|
| Tom Cartos Modern (платные модули, в релиз не входят) | 53 |
| Goldwater Assets (входят в релиз) | 12 |
| Без фона / прочее | 1 |

Пакеты Tom Cartos, на которые опираются сцены: `tom-cartos-modern-city-streets-01`, `tom-cartos-modern-city-streets-02`, `tom-cartos-modern-city-streets-03`, `tom-cartos-modern-downtown-nightclub`, `tom-cartos-modern-grand-library`, `tom-cartos-modern-penthouse`, `tom-cartos-modern-prison`, `tom-cartos-modern-scrapyard`, `tom-cartos-modern-sewers`, `tom-cartos-modern-subway-drug-lab`, `tom-cartos-modern-trainyard`, `tom-cartos-modern-university-quad`, `tom-cartos-modern-water-treatment-plant`, `tomcartosmodern-apartment-block`, `tomcartosmodern-car-park`, `tomcartosmodern-high-school`, `tomcartosmodern-office-block`, `tomcartosmodern-subway-station`.

## Эффекты FXMaster

| Сцена | ID | Эффекты |
|---|---|---|
| Музей | `QxFUM9LeAN2vtOEg` | — |
| New York | `KWZLXPdY2sQ8tVDu` | — |
| New York | `Uicwxtf2pNEmjfaS` | snowstorm, clouds |
| New York (old) | `MtkNmgI7mRFkN69U` | — |
| New York 2 | `rdsiFBtMSgEjXpKD` | clouds, snowstorm |
| Title Screen | `RxYkV8naaa509ZgS` | — |

Сцена **New York** `Uicwxtf2pNEmjfaS` использует эталонные параметры:

- снег: `scale 0.3`, `direction 90`, `speed 0.5`, `lifetime 5`, `density 0.8`, `alpha 1`, `tint.apply false`;
- облака: `scale 1.2`, `direction 90`, `speed 0.6`, `lifetime 5`, `density 0.099`, `alpha 1`, `tint.apply false`.

Эти значения проверяются при каждой сборке: `tools/build-world.mjs` и `tools/verify-v2.mjs`
падают, если хотя бы один параметр отличается.

## Полный список

| Сцена | ID | Размер, px | Сетка | Стены / двери | Свет | Токены | Заметки | Фон |
|---|---|---|---:|---:|---:|---:|---:|---|
| Бернард Колледж блок 1 крыша | `7X6IUyMgUjKiERP3` | 6160×4760 | 140 | 301 / 0 | 0 | 0 | 0 | Tom Cartos · `tom-cartos-modern-university-quad` |
| Бернард Колледж блок 1 этаж 1 | `l33MfkUohYLiaopd` | 6160×4760 | 140 | 703 / 69 | 96 | 0 | 0 | Tom Cartos · `tom-cartos-modern-university-quad` |
| Бернард Колледж блок 1 этаж 2 | `5XGTPXW0Vpeg4Bjg` | 6160×4760 | 140 | 528 / 40 | 150 | 0 | 0 | Tom Cartos · `tom-cartos-modern-university-quad` |
| Бернард Колледж блок 2 крыша | `T3XP6a9bn6yS3vtF` | 6160×4760 | 140 | 109 / 0 | 0 | 0 | 0 | Tom Cartos · `tomcartosmodern-high-school` |
| Бернард Колледж блок 2 этаж 1 | `z8MPulH4pLxpxNMv` | 6160×4760 | 140 | 355 / 57 | 49 | 0 | 0 | Tom Cartos · `tomcartosmodern-high-school` |
| Бернард Колледж блок 2 этаж 2 | `AuLMrytbPLgfryXt` | 6160×4760 | 140 | 247 / 28 | 47 | 0 | 0 | Tom Cartos · `tomcartosmodern-high-school` |
| Библиотека крыша | `T7RWcADMwnUcJoa4` | 4760×3080 | 140 | 178 / 0 | 0 | 0 | 0 | Tom Cartos · `tom-cartos-modern-grand-library` |
| Библиотека этаж 1 | `erzJndXmZY4MwxG7` | 4760×3080 | 140 | 433 / 45 | 55 | 0 | 0 | Tom Cartos · `tom-cartos-modern-grand-library` |
| Библиотека этаж 2 | `nrRu0Ce7s7QHLEvm` | 4760×3080 | 140 | 295 / 12 | 79 | 0 | 0 | Tom Cartos · `tom-cartos-modern-grand-library` |
| Вестибюль | `XVl1L4XGNEq8lbTG` | 3080×2380 | 140 | 159 / 26 | 17 | 0 | 0 | Tom Cartos · `tomcartosmodern-apartment-block` |
| Вокзал | `9gU32dFFTfwraurB` | 4760×3080 | 140 | 300 / 35 | 47 | 0 | 0 | Tom Cartos · `tomcartosmodern-subway-station` |
| Вокзал крыша | `ff35wxCHlPzlmotO` | 4760×3080 | 140 | 63 / 0 | 4 | 0 | 0 | Tom Cartos · `tomcartosmodern-subway-station` |
| Железнодорожное депо | `2GqycKIU3JpKigZO` | 9520×6160 | 140 | 686 / 52 | 47 | 0 | 0 | Tom Cartos · `tom-cartos-modern-trainyard` |
| Железнодорожное депо крыша | `2ypQKLxeDFaPnBMw` | 9520×6160 | 140 | 461 / 37 | 9 | 0 | 0 | Tom Cartos · `tom-cartos-modern-trainyard` |
| Жилые помещения | `HGRr6elPdxzS3mji` | 3080×2380 | 140 | 199 / 32 | 42 | 0 | 0 | Tom Cartos · `tomcartosmodern-apartment-block` |
| Заброшенный особняк — 1 этаж | `22hOuhTHzJPzLTeb` | 8120×5600 | 140 | 319 / 52 (38 секр.) | 75 | 4 | 8 | Goldwater Assets |
| Заброшенный особняк — 2 этаж | `776xRcjVfnnwb6FP` | 8120×5600 | 140 | 278 / 42 (27 секр.) | 69 | 0 | 4 | Goldwater Assets |
| Заброшенный особняк — Подвал | `LjGh960GZ2uafGI0` | 8120×5600 | 140 | 210 / 36 (26 секр.) | 47 | 0 | 4 | Goldwater Assets |
| Канализация - Дренаж | `kG1WTDPjVLjgIRdO` | 3080×2380 | 140 | 149 / 5 | 39 | 0 | 0 | Tom Cartos · `tom-cartos-modern-water-treatment-plant` |
| Канализация - Туннели | `KPS4FJD85HOqbmMd` | 6156×4760 | 140 | 739 / 12 | 187 | 0 | 0 | Tom Cartos · `tom-cartos-modern-sewers` |
| Клуб крыша | `0iOITxhjJdON3pYd` | 4760×3080 | 140 | 188 / 1 | 23 | 0 | 0 | Tom Cartos · `tom-cartos-modern-downtown-nightclub` |
| Клуб Ecliptic | `nrODhqoh5JcZjWOU` | 4760×3080 | 140 | 258 / 31 | 48 | 6 | 0 | Tom Cartos · `tom-cartos-modern-downtown-nightclub` |
| Крыша | `Fjny9g0Kbaprpejm` | 3080×2380 | 140 | 115 / 3 | 18 | 0 | 0 | Tom Cartos · `tomcartosmodern-apartment-block` |
| Крыши | `TDIDUOnNY9UHFsRj` | 3080×2380 | 140 | 123 / 0 | 5 | 0 | 0 | Tom Cartos · `tom-cartos-modern-city-streets-02` |
| Манхатан | `sGCoIEm5WwRmGlOc` | 26684×18876 | 100 | 1 / 0 | 66 | 0 | 0 | Goldwater Assets |
| Манхатан (Copy) | `FtwEaaJDIU4qbyxr` | 26684×18876 | 100 | 1 / 0 | 14 | 9 | 0 | Goldwater Assets |
| Мост | `fKmvFs08atJCmLDk` | 3080×2380 | 140 | 275 / 0 | 88 | 0 | 0 | Tom Cartos · `tom-cartos-modern-city-streets-03` |
| Музей | `QxFUM9LeAN2vtOEg` | 4760×3080 | 140 | 285 / 43 (2 секр.) | 34 | 11 | 0 | Tom Cartos · `tomcartosmodern-office-block` |
| Мэдисон-сквер-гарден - конференц зал | `Ct6pjk5XEcaY7994` | 6160×4760 | 100 | 272 / 23 | 36 | 32 | 0 | Tom Cartos · `tom-cartos-modern-penthouse` |
| Мэдисон-сквер-гарден крыша | `PLpZYryNz30NC8yH` | 6160×4760 | 100 | 219 / 0 | 24 | 0 | 0 | Tom Cartos · `tom-cartos-modern-penthouse` |
| Офис 2 этаж | `M7Mc36ZTIOhYZULU` | 4760×3080 | 140 | 207 / 19 (2 секр.) | 23 | 0 | 0 | Tom Cartos · `tomcartosmodern-office-block` |
| Офис 3 этаж | `ej6YLJpNlnb7SVlX` | 4760×3080 | 140 | 252 / 29 (2 секр.) | 27 | 0 | 0 | Tom Cartos · `tomcartosmodern-office-block` |
| Офис 4 этаж | `lo7ctydtuPaqBMha` | 4760×3080 | 140 | 125 / 7 (2 секр.) | 4 | 0 | 0 | Tom Cartos · `tomcartosmodern-office-block` |
| Парк | `gFclheoyOn8lX8y3` | 3080×2380 | 140 | 185 / 0 | 15 | 0 | 0 | Tom Cartos · `tom-cartos-modern-city-streets-03` |
| Парковка этаж 1 | `vk7B6ojP4Ac2suFh` | 6160×4760 | 80 | 451 / 21 | 21 | 0 | 0 | Tom Cartos · `tomcartosmodern-car-park` |
| Парковка этаж 2 | `Wvsn3HmQcyCmPnwM` | 6160×4760 | 80 | 436 / 15 | 21 | 0 | 0 | Tom Cartos · `tomcartosmodern-car-park` |
| Парковка этаж 3 | `FhxEiuzhQf47seNw` | 6160×4760 | 80 | 413 / 15 | 21 | 0 | 0 | Tom Cartos · `tomcartosmodern-car-park` |
| Парковка этаж 4 | `OHa9qglYwLWlw88v` | 6160×4760 | 80 | 231 / 14 | 30 | 0 | 0 | Tom Cartos · `tomcartosmodern-car-park` |
| Парковка этаж 5 | `G4sGOqtgGHASfRQf` | 6160×4760 | 80 | 161 / 1 | 30 | 0 | 0 | Tom Cartos · `tomcartosmodern-car-park` |
| Пентхаус | `s2Y0FpYvzdo4u9jV` | 3080×2380 | 140 | 196 / 30 | 40 | 1 | 0 | Tom Cartos · `tomcartosmodern-apartment-block` |
| Переулок | `Dt7TKDcnCelyMRuV` | 3080×2380 | 140 | 126 / 0 | 7 | 1 | 0 | Tom Cartos · `tom-cartos-modern-city-streets-01` |
| Подземная парковка | `iHMEdi79Hf3kThs5` | 3080×2380 | 140 | 129 / 7 | 11 | 0 | 0 | Tom Cartos · `tomcartosmodern-apartment-block` |
| Подземные коммуникации | `6SbbIwzrKaayACMx` | 4760×3080 | 140 | 335 / 20 | 51 | 0 | 0 | Tom Cartos · `tom-cartos-modern-subway-drug-lab` |
| Резервуары | `wchHMfWBgyLVd9FQ` | 6160×4760 | 140 | 687 / 12 | 141 | 0 | 0 | Tom Cartos · `tom-cartos-modern-water-treatment-plant` |
| Свалка | `hizT6bCGbJnJEraw` | 6160×4760 | 140 | 682 / 22 | 26 | 0 | 0 | Tom Cartos · `tom-cartos-modern-scrapyard` |
| Свалка крыша | `GCbbHXLsC90Pt2ZH` | 6160×4760 | 140 | 632 / 15 | 17 | 0 | 0 | Tom Cartos · `tom-cartos-modern-scrapyard` |
| Скейт парк | `DebxBbCqJaR3MZUY` | 3080×2380 | 140 | 110 / 0 | 8 | 0 | 0 | Tom Cartos · `tom-cartos-modern-city-streets-02` |
| Станция метро | `g9xcA8CRYUacuzZ0` | 4760×3080 | 140 | 422 / 74 | 36 | 0 | 0 | Tom Cartos · `tomcartosmodern-subway-station` |
| Станция метро пустая | `K9wuH3L5KG5k6F3z` | 4760×3080 | 140 | 158 / 12 | 36 | 0 | 0 | Tom Cartos · `tomcartosmodern-subway-station` |
| Стоки | `lBlhsm5FuhhITz4T` | 3080×2380 | 140 | 200 / 0 | 8 | 1 | 0 | Tom Cartos · `tom-cartos-modern-city-streets-03` |
| Тюрьма этаж 1 | `pLdbbUC6PW2tq86F` | 7140×6160 | 140 | 775 / 158 (3 секр.) | 77 | 0 | 0 | Tom Cartos · `tom-cartos-modern-prison` |
| Тюрьма этаж 2 | `U3oBT4b5vkmogHwn` | 7140×6160 | 140 | 445 / 53 | 39 | 0 | 0 | Tom Cartos · `tom-cartos-modern-prison` |
| Тюрьма этаж 3 | `nzg1GtsiBvdc9ppn` | 7140×6160 | 140 | 269 / 5 | 28 | 0 | 0 | Tom Cartos · `tom-cartos-modern-prison` |
| Убежище | `c43NJl0NfQK7bbVR` | 4760×3080 | 140 | 437 / 37 | 32 | 0 | 0 | Tom Cartos · `tom-cartos-modern-subway-drug-lab` |
| Улица | `Lyc7SLhUHFv0W7Rj` | 3080×2380 | 140 | 144 / 0 | 18 | 0 | 0 | Tom Cartos · `tom-cartos-modern-city-streets-01` |
| Улица 2 | `0xm3u1ONRbbWEhOz` | 3080×2380 | 140 | 376 / 0 | 33 | 0 | 0 | Tom Cartos · `tom-cartos-modern-city-streets-02` |
| Улица 3 | `McKsJcY9f3mWAhJG` | 3080×2380 | 140 | 335 / 0 | 28 | 0 | 0 | Tom Cartos · `tom-cartos-modern-city-streets-02` |
| capella | `ElHVYBYZQCJdchym` | 3920×2660 | 100 | 60 / 2 | 16 | 0 | 0 | Goldwater Assets |
| New York | `KWZLXPdY2sQ8tVDu` | 1968×1440 | 100 | 0 / 0 | 3 | 0 | 0 | Goldwater Assets |
| New York | `Uicwxtf2pNEmjfaS` | 4934×5278 | 100 | 0 / 0 | 136 | 5 | 45 | Goldwater Assets |
| New York (old) | `MtkNmgI7mRFkN69U` | 1968×1440 | 100 | 0 / 0 | 7 | 0 | 1 | Goldwater Assets |
| New York 2 | `rdsiFBtMSgEjXpKD` | 4934×5278 | 100 | 0 / 0 | 135 | 0 | 0 | Goldwater Assets |
| Title Screen | `RxYkV8naaa509ZgS` | 4000×2300 | 70 | 0 / 0 | 17 | 0 | 0 | Goldwater Assets |
| Vegas | `DM0FIMPv4RVkTL5b` | 13302×10053 | 100 | 0 / 0 | 4 | 0 | 0 | Goldwater Assets |
| void | `NMxcUY5hX9i98m5p` | 4000×3000 | 100 | 0 / 0 | 0 | 0 | 0 | нет фона |
| Water Treatment Plant 03 Roof | `T979GfLau96TRKj8` | 6160×4760 | 140 | 598 / 4 | 121 | 0 | 0 | Tom Cartos · `tom-cartos-modern-water-treatment-plant` |
