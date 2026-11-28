# Токены персонажей — 3.0.0

Все токены взяты из библиотеки **New York by Night** (`Токены VtM_ Нью-Йорк 2000 (3).html`
и два архива `vtm_ny2000_part1/2.zip`). Картинки лежат внутри архива мира:
`assets/tokens/vtm_ny2000/<категория>/<файл>.png`, в документах — `worlds/goldwater-cuckold/assets/tokens/...`.

## Сводка

| Показатель | Значение |
|---|---:|
| Actor Documents в мире | 183 |
| Заменён основной токен | 175 |
| Оставлено прежнее изображение | 8 |
| Персонажей с вариантами Token Variant Art | 80 |
| Дополнительных изображений в вариантах | 80 |
| Различных файлов токенов в сборке | 190 |
| Сцен сохранено / удалено | 12 / 54 |

## Как устроены варианты

Для каждого персонажа записан флаг актора, который читает Token Variant Art 5.1.6:

```json
flags.token-variants.variants = [{ "imgSrc": "worlds/goldwater-cuckold/assets/tokens/...", "names": ["Имя"] }]
```

Кнопка вариантов на Token HUD показывает эти изображения и переключает `prototypeToken.texture.src`.
Основной токен — нейтральный вариант без оружия и предметов (`_noitems` / `_noweapon`), если он есть.

## Сопоставление

| Actor в Foundry | Папка | Исходное изображение | Основной токен | Дополнительные варианты | Основание |
|---|---|---|---|---|---|
| 123 | (cuck)old | `zondbprizrak.png` | `giovanni_necro_noitems.png` | `giovanni_necro.png` | неканонический персонаж: мужской токен по полу и роли |
| Ава Джонсон | Random asspull | `Слой 1.png` | `goth_girl.png` | — | случайный NPC: женский токен по полу, одежде и роли |
| Аделаида Дэвис | Камарильцы | `ADELAIDE DAVIS, THE CURSE OF SNUG HARBOR_token.png` | `adelaide_davis_noitems.png` | `adelaide_davis.png` | точное совпадение имени с библиотекой токенов |
| Аделаида Дэвис | Связи | `ADELAIDE DAVIS, THE CURSE OF SNUG HARBOR_token.png` | `adelaide_davis_noitems.png` | `adelaide_davis.png` | точное совпадение имени с библиотекой токенов |
| Аиша Уайт | Brute Squad | `mystery-man.svg` | `club_girl_red.png` | — | неканонический NPC: женский уличный/клан-токен по роли |
| Алан Персон | Игрочки | `alan_person.png` | `alan_person.png` | — | точное совпадение имени с библиотекой токенов |
| Александр Иванов | Random asspull | `Слой 43.png` | `goth_guy.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Александр Чой | Random asspull | `Слой 2.png` | `gangster_track.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Альмиро Суарез | Камарильцы | `Альмиро Суарез токен.png` | `bouncer_suit.png` | — | нет канонического изображения: мужской токен по полу и роли |
| Ариа Ким | Random asspull | `Слой 25.png` | `student.png` | — | случайный NPC: женский токен по полу, одежде и роли |
| Артём Франк | (cuck)old | `faa3ec37be7c481aa5239eac1023d921.png` | `nosferatu_informer_noitems.png` | `nosferatu_informer.png` | неканонический персонаж: мужской токен по полу и роли |
| Без Дансирн | Связи | `BEZ DUNSIRN_token.png` | `bez_dansirn.png` | — | точное совпадение имени с библиотекой токенов |
| Без Дансирн | Джованни | `BEZ DUNSIRN_token.png` | `bez_dansirn.png` | — | точное совпадение имени с библиотекой токенов |
| Белль Экитон (Copy) | Сеттиты | `Белль Экитон токен.png` | `streetwalker_noitems.png` | `streetwalker.png` | нет канонического изображения: женский токен по полу и роли |
| Бенджамин Ричардс | Random asspull | `Слой 20.png` | `brujah.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Билли О'Кэннон | (cuck)old | `billytoken.png` | `cop_nypd.png` | — | неканонический персонаж: мужской токен по полу и роли |
| Близняшка | Связи | `GEMINI_token.png` | `twinsie.png` | `twinsie_v1.png` | точное совпадение имени с библиотекой токенов |
| Близняшка | Камарильцы | `GEMINI_token.png` | `twinsie.png` | `twinsie_v1.png` | точное совпадение имени с библиотекой токенов |
| Бобби Прайд | Охотники | `BOBBY PRIDE_token.png` | `bobby_pride_noitems.png` | `bobby_pride.png` | точное совпадение имени с библиотекой токенов |
| Бобби Прайд | Связи | `BOBBY PRIDE_token.png` | `bobby_pride_noitems.png` | `bobby_pride.png` | точное совпадение имени с библиотекой токенов |
| Босс Каллихан | Связи | `BOSS CALLIHAN_token.png` | `boss_callahan_noitems.png` | `boss_callahan.png` | точное совпадение имени с библиотекой токенов |
| Босс Каллихан | Анархи | `BOSS CALLIHAN_token.png` | `boss_callahan_noitems.png` | `boss_callahan.png` | точное совпадение имени с библиотекой токенов |
| Бэн 10 | (cuck)old | `ca339fdf5c3b1630-600x338-2882689863.jpg` | `punk.png` | — | неканонический персонаж: мужской токен по полу и роли |
| Валентин | Связи | `Valentine_Token.png` | `valentin_noitems.png` | `valentin.png` | точное совпадение имени с библиотекой токенов |
| Валентин | Камарильцы | `Valentine_Token.png` | `valentin_noitems.png` | `valentin.png` | точное совпадение имени с библиотекой токенов |
| Валерия Мартинес | Brute Squad | `mystery-man.svg` | `brujah_girl_noweapon.png` | `brujah_girl.png` | неканонический NPC: женский уличный/клан-токен по роли |
| Вампир | (cuck)old | `mystery-man.svg` | `ventrue_noitems.png` | `ventrue.png` | роль указана в имени персонажа |
| Варя Корлов | Камарильцы | `Варя Корлов токен.png` | `dealer_noitems.png` | `dealer.png` | нет канонического изображения: мужской токен по полу и роли |
| вась | Игрочки | `%D0%B2%D0%B0%D1%81%D1%8C.png` | `vas.png` | — | точное совпадение имени с библиотекой токенов |
| Винс Черутти | Полуночники | `VINCE CERUTTI_token.png` | `vince_cerutti_noweapon.png` | `vince_cerutti.png` | точное совпадение имени с библиотекой токенов |
| Винс Черутти | Связи | `VINCE CERUTTI_token.png` | `vince_cerutti_noweapon.png` | `vince_cerutti.png` | точное совпадение имени с библиотекой токенов |
| Вкид | Игрочки | `%D0%B2%D0%BA%D0%B8%D0%B4.png` | `vkid.png` | — | точное совпадение имени с библиотекой токенов |
| Вольф | Brute Squad | `mystery-man.svg` | `toreador.png` | — | неканонический NPC: мужской уличный/клан-токен по роли |
| Габриэль Браун | Random asspull | `Слой 29.png` | `jogger.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| ганс ланда | Игрочки | `mystery-man.svg` | `thug_hoodie_noweapon.png` | `thug_hoodie.png` | нет канонического изображения: мужской токен по полу и роли |
| Гебель Фон Штирлиц | (cuck)old | `token_1 (3).png` | `ghoul_chauffeur.png` | — | неканонический персонаж: мужской токен по полу и роли |
| Генри Чапман | Игрочки | `henry_chapman.png` | `henry_chapman.png` | — | точное совпадение имени с библиотекой токенов |
| Горгулья 1 | Камарильцы | `Горгулья 1.png` | `cybergoth.png` | — | нет канонического изображения: мужской токен по полу и роли |
| Горгулья 2 | Камарильцы | `Горгулья 2.png` | `lasombra_priest.png` | — | нет канонического изображения: мужской токен по полу и роли |
| Грейс Ким | Random asspull | `Слой 44.png` | `ventrue_lady.png` | — | случайный NPC: женский токен по полу, одежде и роли |
| Дезмонд Лерой Маккей | Игрочки | `desmond_mckay.png` | `desmond_mckay_noitems.png` | `desmond_mckay.png` | точное совпадение имени с библиотекой токенов |
| Джамал Уильямс | Random asspull | `Слой 19.png` | `malkavian.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Джезебель | Камарильцы | `JEZEBELLE, THE FORGOTTEN HERO_token.png` | `jezebel.png` | — | точное совпадение имени с библиотекой токенов |
| Джезебель | Связи | `JEZEBELLE, THE FORGOTTEN HERO_token.png` | `jezebel.png` | — | точное совпадение имени с библиотекой токенов |
| Джейкоб Хэнсон | Random asspull | `Слой 34.png` | `leopold_inquisitor_noweapon.png` | `leopold_inquisitor.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Джейкоб Хэнсон | Random asspull | `Слой 33.png` | `setite.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Джерри Смит | Brute Squad | `mystery-man.svg` | `jiangshi.png` | — | неканонический NPC: мужской уличный/клан-токен по роли |
| Джим Гандер (Copy) | Сеттиты | `Джим Гандер токен.png` | `bouncer_crossed.png` | — | нет канонического изображения: мужской токен по полу и роли |
| Джон Граммэр | Игрочки | `Глист.png` | `john_grammer.png` | — | точное совпадение имени с библиотекой токенов |
| Джон Клэр | (cuck)old | `token_logo.png` | `giovanni.png` | — | неканонический персонаж: мужской токен по полу и роли |
| Джонатан Гарсел | Связи | `JONATHAN GURSEL_token.png` | `jonathan_garsel.png` | — | точное совпадение имени с библиотекой токенов |
| Джонатан Гарсел | Первоклассные Серцееды | `JONATHAN GURSEL_token.png` | `jonathan_garsel.png` | — | точное совпадение имени с библиотекой токенов |
| Джошуа Торрес | Random asspull | `Слой 3.png` | `ghoul_butler.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Джулия Мартинес | Random asspull | `Слой 4.png` | `setite_priestess.png` | — | случайный NPC: женский токен по полу, одежде и роли |
| Диана Вик | Камарильцы | `DIANA VICK, “NICKY THE CHOP”_token.png` | `diana_vick.png` | — | точное совпадение имени с библиотекой токенов |
| Диана Вик | Связи | `DIANA VICK, “NICKY THE CHOP”_token.png` | `diana_vick.png` | — | точное совпадение имени с библиотекой токенов |
| Дино Черутти | Связи | `DINO CERUTTI_token.png` | `dino_cerutti_noweapon.png` | `dino_cerutti.png` | точное совпадение имени с библиотекой токенов |
| Дино Черутти | Полуночники | `DINO CERUTTI_token.png` | `dino_cerutti_noweapon.png` | `dino_cerutti.png` | точное совпадение имени с библиотекой токенов |
| Донателло Джованни | Джованни | `DONATELLO GIOVANNI_token.png` | `donatello_giovanni.png` | — | точное совпадение имени с библиотекой токенов |
| Донателло Джованни | Связи | `DONATELLO GIOVANNI_token.png` | `donatello_giovanni.png` | — | точное совпадение имени с библиотекой токенов |
| Дэвид Морган | Камарильцы | `DAVID MORGAN, THE SCOURGE_token.png` | `david_morgan_noweapon.png` | `david_morgan.png` | точное совпадение имени с библиотекой токенов |
| Дэвид Морган | Связи | `DAVID MORGAN, THE SCOURGE_token.png` | `david_morgan_noweapon.png` | `david_morgan.png` | точное совпадение имени с библиотекой токенов |
| Дэвид Рамирес | Random asspull | `Слой 39.png` | `ravnos.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Жанна Невельсон | Связи | `ZHANNA NEVELSKY_token.png` | `jeanne_nevelskaya.png` | — | точное совпадение имени с библиотекой токенов |
| Жанна Невельсон | Охотники | `ZHANNA NEVELSKY_token.png` | `jeanne_nevelskaya.png` | — | точное совпадение имени с библиотекой токенов |
| Жерар Рафен | Камарильцы | `GERARD RAFIN, “UNCLE SMELLY”_token.png` | `gerard_raffin.png` | — | точное совпадение имени с библиотекой токенов |
| Жерар Рафен | Связи | `GERARD RAFIN, “UNCLE SMELLY”_token.png` | `gerard_raffin.png` | — | точное совпадение имени с библиотекой токенов |
| Закари Коэн | Random asspull | `Слой 13.png` | `security_guard_noitems.png` | `security_guard.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Иветта Печальная | Камарильцы | `YVETTE, THE HOPELESS_token.png` | `yvette_the_sad.png` | — | точное совпадение имени с библиотекой токенов |
| Иветта Печальная | Связи | `YVETTE, THE HOPELESS_token.png` | `yvette_the_sad.png` | — | точное совпадение имени с библиотекой токенов |
| Изабелла Чжан | Random asspull | `Слой 16.png` | `passer_woman_coat_noitems.png` | `passer_woman_coat.png` | случайный NPC: женский токен по полу, одежде и роли |
| Илайджа Смит | Random asspull | `Слой 14.png` | `sabbat_punk_noweapon.png` | `sabbat_punk.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Кадир Аль-Асмей | Камарильцы | `QADIR AL-ASMAI, THE SHERIFF_token.png` | `qadir_al_asmei.png` | — | точное совпадение имени с библиотекой токенов |
| Кадир Аль-Асмей | Связи | `QADIR AL-ASMAI, THE SHERIFF_token.png` | `qadir_al_asmei.png` | — | точное совпадение имени с библиотекой токенов |
| Калеброс | Связи | `CALEBROS, THE ERSTWHILE PRINCE_token.png` | `calebros_noitems.png` | `calebros.png` | точное совпадение имени с библиотекой токенов |
| Калеброс | Камарильцы | `CALEBROS, THE ERSTWHILE PRINCE_token.png` | `calebros_noitems.png` | `calebros.png` | точное совпадение имени с библиотекой токенов |
| Карл Йохансен | Камарильцы | `Карл Йохансен токен.png` | `russian_mob_noweapon.png` | `russian_mob.png` | нет канонического изображения: мужской токен по полу и роли |
| Карлос Альварес | Random asspull | `Слой 9.png` | `raver_guy.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Картер Вандервейден | Камарильцы | `CARTER VANDERWEYDEN_token.png` | `carter_vandervelden_noitems.png` | `carter_vandervelden.png` | точное совпадение имени с библиотекой токенов |
| Картер Вандервейден | Связи | `CARTER VANDERWEYDEN_token.png` | `carter_vandervelden_noitems.png` | `carter_vandervelden.png` | точное совпадение имени с библиотекой токенов |
| Кёрн Вискард фон Дарриер | (cuck)old | `token_logo2.png` | `doctor.png` | — | неканонический персонаж: мужской токен по полу и роли |
| Коннор Мерфи | Random asspull | `Слой 31.png` | `caitiff.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Кривозубич | Игрочки | `cb556494-4b49-478f-985d-c96f808eca25.png` | `sabbat_bishop_noitems.png` | `sabbat_bishop.png` | нет канонического изображения: мужской токен по полу и роли |
| Крид | Камарильцы | `KRID_token.png` | `creed.png` | — | точное совпадение имени с библиотекой токенов |
| Крид | Связи | `KRID_token.png` | `creed.png` | — | точное совпадение имени с библиотекой токенов |
| Кэнди Кейн | Первоклассные Серцееды | `KANDY KAINE_token.png` | `candy_kane.png` | — | точное совпадение имени с библиотекой токенов |
| Кэнди Кейн | Связи | `KANDY KAINE_token.png` | `candy_kane.png` | — | точное совпадение имени с библиотекой токенов |
| Кэтрин Вайс | Связи | `Katherine_Wiese.png` | `katherine_weiss.png` | — | точное совпадение имени с библиотекой токенов |
| Кэтрин Вайс | Камарильцы | `Katherine_Wiese.png` | `katherine_weiss.png` | — | точное совпадение имени с библиотекой токенов |
| Леонардо Маркес | Random asspull | `Слой 38.png` | `zantosa_noitems.png` | `zantosa.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Лиам Андерсон | Random asspull | `Слой 24.png` | `black_hand_noweapon.png` | `black_hand.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Лили Санчес | Random asspull | `Слой 36.png` | `club_girl_leather_noitems.png` | `club_girl_leather.png` | случайный NPC: женский токен по полу, одежде и роли |
| Лобанов | (cuck)old | `3c04c8396455342d.png` | `ventrue_noitems.png` | `ventrue.png` | неканонический персонаж: мужской токен по полу и роли |
| Лорд Эфраим Уэйнрайт | Камарильцы | `LORD EPHRAIM WAINWRIGHT, “IMP”_token.png` | `ephraim_wainwright_noitems.png` | `ephraim_wainwright.png` | точное совпадение имени с библиотекой токенов |
| Лорд Эфраим Уэйнрайт | Связи | `LORD EPHRAIM WAINWRIGHT, “IMP”_token.png` | `ephraim_wainwright_noitems.png` | `ephraim_wainwright.png` | точное совпадение имени с библиотекой токенов |
| Люис Моралес | Random asspull | `Слой 42png.png` | `construction.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Мазз | Связи | `MAZZ_token.png` | `mazz.png` | — | точное совпадение имени с библиотекой токенов |
| Мазз | Гарпии | `MAZZ_token.png` | `mazz.png` | — | точное совпадение имени с библиотекой токенов |
| Майк Росс | Игрочки | `mike_ross.png` | `mike_ross.png` | — | точное совпадение имени с библиотекой токенов |
| Майкл Невельсон | Связи | `MICHAEL NEVELSON_token.png` | `michael_nevelson_noitems.png` | `michael_nevelson.png` | точное совпадение имени с библиотекой токенов |
| Майкл Невельсон | Охотники | `MICHAEL NEVELSON_token.png` | `michael_nevelson_noitems.png` | `michael_nevelson.png` | точное совпадение имени с библиотекой токенов |
| Малик Томпсон | Random asspull | `Слой 15.png` | `homeless_noitems.png` | `homeless.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Марко Руссо | Random asspull | `Слой 11.png` | `kiasyd.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Мартин Ким | Brute Squad | `mystery-man.svg` | `dj.png` | — | неканонический NPC: мужской уличный/клан-токен по роли |
| Масика Сейнт-Джон | Камарильцы | `MASIKA ST. JOHN, THE CAMNET INNOVATOR_token.png` | `masika_saint_john_noitems.png` | `masika_saint_john.png` | точное совпадение имени с библиотекой токенов |
| Масика Сейнт-Джон | Связи | `MASIKA ST. JOHN, THE CAMNET INNOVATOR_token.png` | `masika_saint_john_noitems.png` | `masika_saint_john.png` | точное совпадение имени с библиотекой токенов |
| Матео Флорес | Random asspull | `Слой 27.png` | `office_clerk_noitems.png` | `office_clerk.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Мия Гонсалес | Random asspull | `Слой 23.png` | `old_woman_noitems.png` | `old_woman.png` | случайный NPC: женский токен по полу, одежде и роли |
| Натан Харрис | Random asspull | `Слой 5.png` | `hitman_noweapon.png` | `hitman.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Николас Ортис | Random asspull | `Слой 40.png` | `sabbat_templar_noweapon.png` | `sabbat_templar.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Николас Чанг | Связи | `NICHOLAS CHANG_token.png` | `nicholas_chang.png` | — | точное совпадение имени с библиотекой токенов |
| Николас Чанг | Полуночники | `NICHOLAS CHANG_token.png` | `nicholas_chang.png` | — | точное совпадение имени с библиотекой токенов |
| Ноа Уокер | Random asspull | `Слой 17.png` | `triad_noweapon.png` | `triad.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Оборотень | (cuck)old | `mystery-man.svg` | `garou_glabro.png` | — | роль указана в имени персонажа |
| Оливия Браун | Random asspull | `Слой 28.png` | `imbued_noweapon.png` | `imbued.png` | случайный NPC: женский токен по полу, одежде и роли |
| Оскар Вильяреаль | Random asspull | `Слой 37.png` | `shovelhead.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| пидор 1 | (cuck)old | `mystery-man.svg` | `kuei_jin.png` | — | неканонический персонаж: мужской токен по полу и роли |
| пидор 2 | (cuck)old | `mystery-man.svg` | `bratovich_noweapon.png` | `bratovich.png` | неканонический персонаж: мужской токен по полу и роли |
| Приа Гупта | Random asspull | `Слой 7.png` | `cacophony_noitems.png` | `cacophony.png` | случайный NPC: женский токен по полу, одежде и роли |
| Птенец Ассамит | Brute Squad | `mystery-man.svg` | `assamite_noweapon.png` | `assamite.png` | роль указана в имени персонажа |
| Птенец Бруха | Brute Squad | `mystery-man.svg` | `brujah_girl_noweapon.png` | `brujah_girl.png` | роль указана в имени персонажа |
| Птенец Гангрел | Brute Squad | `mystery-man.svg` | `gangrel.png` | — | роль указана в имени персонажа |
| Птенец Тзимисце | Brute Squad | `mystery-man.svg` | `shovelhead.png` | — | роль указана в имени персонажа |
| Райан Джеймс | Random asspull | `Слой 30.png` | `mafioso.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Рашид Стоктон | Лёгкие Слёзы Любви | `RASHID STOCKTON_token.png` | `rashid_stockton.png` | — | точное совпадение имени с библиотекой токенов |
| Рашид Стоктон | Связи | `RASHID STOCKTON_token.png` | `rashid_stockton.png` | — | точное совпадение имени с библиотекой токенов |
| Рюрик Ракоши | Лёгкие Слёзы Любви | `Рюрик Ракоши4.png` | `ruryk_rakoczy.png` | — | точное совпадение имени с библиотекой токенов |
| Рюрик Ракоши | Связи | `RURIK RAKOCZY_token.png` | `ruryk_rakoczy.png` | — | точное совпадение имени с библиотекой токенов |
| Симон Джексон | Random asspull | `Слой 26.png` | `hunter_stake_noweapon.png` | `hunter_stake.png` | случайный NPC: мужской токен по полу, одежде и роли |
| София Ли | Random asspull | `Слой 18.png` | `businesswoman_noitems.png` | `businesswoman.png` | случайный NPC: женский токен по полу, одежде и роли |
| Стивен Кларк | Сеттиты | `STEVEN CLARKE_token.png` | `stephen_clark.png` | `stephen_clark_casual.png` | точное совпадение имени с библиотекой токенов |
| Стивен Кларк | Связи | `STEVEN CLARKE_token.png` | `stephen_clark.png` | `stephen_clark_casual.png` | точное совпадение имени с библиотекой токенов |
| Сун Ян, «Мудрая Лягушка» | Связи | `SUN YANG, “WISE FROG”_token.png` | `swat_noweapon.png` | `swat.png` | нет канонического изображения: мужской токен по полу и роли |
| Сун Ян, «Мудрая Лягушка» | Ассамиты | `SUN YANG, “WISE FROG”_token.png` | `ghoul_feral.png` | — | нет канонического изображения: мужской токен по полу и роли |
| Тёмнов | (cuck)old | `token_1 (4).png` | `robber_mask_noweapon.png` | `robber_mask.png` | неканонический персонаж: мужской токен по полу и роли |
| Тео Белл | Камарильцы | `theobell_token.png` | `theo_bell_noweapon.png` | `theo_bell.png` | точное совпадение имени с библиотекой токенов |
| Тео Белл | Связи | `theobell_token.png` | `theo_bell_noweapon.png` | `theo_bell.png` | точное совпадение имени с библиотекой токенов |
| Тирон Картер | Random asspull | `Слой 21.png` | `bartender_noitems.png` | `bartender.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Тобиас Грэй | Random asspull | `Слой 8.png` | `gang_biker_noitems.png` | `gang_biker.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Томас Артуро | Связи | `THOMAS ARTURO_token.png` | `thomas_arturo_noitems.png` | `thomas_arturo.png` | точное совпадение имени с библиотекой токенов |
| Томас Артуро | Гарпии | `THOMAS ARTURO_token.png` | `thomas_arturo_noitems.png` | `thomas_arturo.png` | точное совпадение имени с библиотекой токенов |
| Томас Уэллби | Камарильцы | `Томас Уэллби Токен.png` | `assamite_noweapon.png` | `assamite.png` | нет канонического изображения: мужской токен по полу и роли |
| Топкэт (Copy) | Сеттиты | `Топкэт токен.png` | `samedi.png` | — | нет канонического изображения: мужской токен по полу и роли |
| Тэйшон Кёрнс | Камарильцы | `TAYSHAWN KEARNS_token.png` | `clubber_silk.png` | — | нет канонического изображения: мужской токен по полу и роли |
| Тэйшон Кёрнс | Связи | `TAYSHAWN KEARNS_token.png` | `leopold_soldier_noweapon.png` | `leopold_soldier.png` | нет канонического изображения: мужской токен по полу и роли |
| тяжёлая мама | Игрочки | `mystery-man.svg` | `tremere_noitems.png` | `tremere.png` | нет канонического изображения: мужской токен по полу и роли |
| Фербрух | Камарильцы | `VERBRUCH_token.png` | `verbruch.png` | — | точное совпадение имени с библиотекой токенов |
| Фербрух | Связи | `VERBRUCH_token.png` | `verbruch.png` | — | точное совпадение имени с библиотекой токенов |
| Филипп Беннет | Random asspull | `Слой 6.png` | `junkie_noitems.png` | `junkie.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Франсиско Доминго де Полонья | Связи | `FRANCISCO DOMINGO DE POLONIA_token.png` | `francisco_de_polonia_noweapon.png` | `francisco_de_polonia.png` | точное совпадение имени с библиотекой токенов |
| Франсиско Доминго де Полонья | Епископы/Архиепископы/Другие высшие чины | `FRANCISCO DOMINGO DE POLONIA_token.png` | `francisco_de_polonia_noweapon.png` | `francisco_de_polonia.png` | точное совпадение имени с библиотекой токенов |
| Хелен Панард | Связи | `HELLENE PANHARD_token.png` | `helena_penhard.png` | — | точное совпадение имени с библиотекой токенов |
| Хелен Панард | Гарпии | `HELLENE PANHARD_token.png` | `helena_penhard.png` | — | точное совпадение имени с библиотекой токенов |
| Хуан Сальвадор | Random asspull | `Слой 35.png` | `tzimisce_noble.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Чижик | (cuck)old | `mystery-man.svg` | `mib_technocrat.png` | — | неканонический персонаж: мужской токен по полу и роли |
| Шон Даллес | (cuck)old | `token_1 (2).png` | `faith_priest_noitems.png` | `faith_priest.png` | неканонический персонаж: мужской токен по полу и роли |
| Эбан Бушар | Brute Squad | `mystery-man.svg` | `grimaldi_noitems.png` | `grimaldi.png` | неканонический NPC: мужской уличный/клан-токен по роли |
| Элизабет Хорсманден «Марлена» | Камарильцы | `eliz_token.png` | `elizabeth_horsmanden.png` | — | точное совпадение имени с библиотекой токенов |
| Элизабет Хорсманден «Марлена» | Связи | `eliz_token.png` | `elizabeth_horsmanden.png` | — | точное совпадение имени с библиотекой токенов |
| Эмили Райт | Random asspull | `Слой 32.png` | `gangrel_wild.png` | — | случайный NPC: женский токен по полу, одежде и роли |
| Эмма Дэвис | Random asspull | `Слой 10.png` | `nurse.png` | — | случайный NPC: женский токен по полу, одежде и роли |
| Энтони Миллер | Random asspull | `Слой 22.png` | `priest_noitems.png` | `priest.png` | случайный NPC: мужской токен по полу, одежде и роли |
| Эстер Рид | Лёгкие Слёзы Любви | `HESTER REED_token.png` | `esther_reed.png` | — | точное совпадение имени с библиотекой токенов |
| Эстер Рид | Связи | `HESTER REED_token.png` | `esther_reed.png` | — | точное совпадение имени с библиотекой токенов |
| Этан О'Коннор | Random asspull | `Слой 12.png` | `baali.png` | — | случайный NPC: мужской токен по полу, одежде и роли |
| Эугенио Эстевес | Связи | `EUGENIO ESTEVEZ, “GENIE” _token.png` | `eugenio_estevez.png` | — | точное совпадение имени с библиотекой токенов |
| Эугенио Эстевес | Камарильцы | `EUGENIO ESTEVEZ, “GENIE” _token.png` | `eugenio_estevez.png` | — | точное совпадение имени с библиотекой токенов |
| Эшлинг Стёрбридж | Связи | `AISLING STURBRIDGE, HIGH REGENT OF CHANTRY OF THE FIVE BOROUGHS_token.png` | `mafia_don_noitems.png` | `mafia_don.png` | нет канонического изображения: мужской токен по полу и роли |
| Эшлинг Стёрбридж | Камарильцы | `AISLING STURBRIDGE, HIGH REGENT OF CHANTRY OF THE FIVE BOROUGHS_token.png` | `gangrel.png` | — | нет канонического изображения: мужской токен по полу и роли |
| Яра Мартинес | Random asspull | `Слой 41.png` | `raver_girl.png` | — | случайный NPC: женский токен по полу, одежде и роли |
| Яхмос Чеймберс (Copy) | Сеттиты | `Яхмос Чеймберс токен.png` | `hermetic_mage_noitems.png` | `hermetic_mage.png` | нет канонического изображения: мужской токен по полу и роли |
| hong lu | (cuck)old | `mystery-man.svg` | `harbinger.png` | — | неканонический персонаж: мужской токен по полу и роли |
| Monokoleso | Игрочки | `Monokoleso.png` | `obertus_noitems.png` | `obertus.png` | нет канонического изображения: мужской токен по полу и роли |
| So-Sal | (cuck)old | `mystery-man.svg` | `nosferatu.png` | — | неканонический персонаж: мужской токен по полу и роли |
| sutener pidor | (cuck)old | `token_2 (3).png` | `giovanni_necro_noitems.png` | `giovanni_necro.png` | неканонический персонаж: мужской токен по полу и роли |
| Байк | Игрочки | `TCM_Motorbike Retro Black_1x2.png` | — | — | в библиотеке нет изображения этого персонажа — оставлено прежнее |
| Белль Экитон | Сеттиты | `Белль Экитон токен.png` | — | — | в библиотеке нет изображения этого персонажа — оставлено прежнее |
| Джим Гандер | Сеттиты | `Джим Гандер токен.png` | — | — | в библиотеке нет изображения этого персонажа — оставлено прежнее |
| Сахира Сираж | Сеттиты | `Сахира Сираж токен.png` | — | — | в библиотеке нет изображения этого персонажа — оставлено прежнее |
| Топкэт | Сеттиты | `Топкэт токен.png` | — | — | в библиотеке нет изображения этого персонажа — оставлено прежнее |
| Эли Сансарик | Сеттиты | `Эли Сансарик токен.png` | — | — | в библиотеке нет изображения этого персонажа — оставлено прежнее |
| Яхмос Чеймберс | Сеттиты | `Яхмос Чеймберс токен.png` | — | — | в библиотеке нет изображения этого персонажа — оставлено прежнее |
| Bogatyr | Other | `mahoraga.PNG` | — | — | в библиотеке нет изображения этого персонажа — оставлено прежнее |

## Случайные NPC

Папка **Random asspull** (44 актора), **Brute Squad** (10), **(cuck)old** (18) и неканонические
персонажи остальных папок получили токены из общих категорий библиотеки (`kine`, `crime`, `club`,
`cam`, `indep`, `sabbat`, `ghoul`, `blood`, `undead`, `were`, `hunter`, `beast`). Пол определялся по
имени, поэтому женские и мужские токены не перепутаны; пулы перемешаны детерминированно, поэтому
повторов почти нет — на 86 «общих» персонажей приходится 85 разных основных токенов.

## Персонажи без нового токена

В библиотеке нет изображения именно этого персонажа, а своё уникальное изображение у него уже есть —
поэтому изображение оставлено прежним (подмена на «похожего» не делалась):

- **Байк** — `assets/worldofdarkness/goldwater-cuckold/new-york/TCM_Motorbike Retro Black_1x2.png` (в библиотеке нет изображения этого персонажа — оставлено прежнее)
- **Белль Экитон** — `assets/worldofdarkness/goldwater-cuckold/new-york/Портреты-и-токены/Белль Экитон токен.png` (в библиотеке нет изображения этого персонажа — оставлено прежнее)
- **Джим Гандер** — `assets/worldofdarkness/goldwater-cuckold/new-york/Портреты-и-токены/Джим Гандер токен.png` (в библиотеке нет изображения этого персонажа — оставлено прежнее)
- **Сахира Сираж** — `assets/worldofdarkness/goldwater-cuckold/new-york/Портреты-и-токены/Сахира Сираж токен.png` (в библиотеке нет изображения этого персонажа — оставлено прежнее)
- **Топкэт** — `assets/worldofdarkness/goldwater-cuckold/new-york/Портреты-и-токены/Топкэт токен.png` (в библиотеке нет изображения этого персонажа — оставлено прежнее)
- **Эли Сансарик** — `assets/worldofdarkness/goldwater-cuckold/new-york/Портреты-и-токены/Эли Сансарик токен.png` (в библиотеке нет изображения этого персонажа — оставлено прежнее)
- **Яхмос Чеймберс** — `assets/worldofdarkness/goldwater-cuckold/new-york/Портреты-и-токены/Яхмос Чеймберс токен.png` (в библиотеке нет изображения этого персонажа — оставлено прежнее)
- **Bogatyr** — `assets/worldofdarkness/goldwater-cuckold/mahoraga.PNG` (в библиотеке нет изображения этого персонажа — оставлено прежнее)
