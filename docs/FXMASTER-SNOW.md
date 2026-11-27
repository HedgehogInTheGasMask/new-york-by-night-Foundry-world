# FXMaster и снег на сцене «New York»

Сцена **New York** `Uicwxtf2pNEmjfaS` рисует снег и облака модулем **FXMaster**. Внешний вид
задают два независимых фактора: флаги сцены `flags.fxmaster.effects` и версия самого модуля.
Флаги в этом репозитории — эталонные, поэтому расхождение даёт версия модуля.

## 1. Нужная версия — 5.0.1

| Версия | Что с рисовкой снега |
|---|---|
| **5.0.1** | эталон: эффект собирается из частиц PIXI, `scale` / `speed` / `lifetime` / `density` трактуются буквально |
| 7.2.0+ | `density` нормализован: те же числа дают другое количество частиц |
| 8.3.0+ | `Snowstorm` переписан на процедурный шейдер, `getParticleEmitters()` возвращает `[]` — частиц нет вообще |
| 8.4.2 | манифест объявляет `minimum: 13`, на ядре Foundry 12.331 модуль несовместим и штатно не включается |

Одинаковые числа в конфигурации при 5.0.1 и 8.x дают разную картинку: количество, размер и
траектория снежинок считаются разным кодом. Подбирать параметры под 8.x бессмысленно — нужна 5.0.1.

## 2. Установка

**Из этого репозитория (одна ссылка).** Setup → **Add-on Modules** → **Install Module** → Manifest URL:

```
https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases/latest/download/fxmaster.json
```

Установщик скачает `fxmaster-5.0.1.zip` — **байт-в-байт официальный релиз** `ghost-fvtt/fxmaster`
v5.0.1 (sha256 `1c7574caac13c8555cb4e961832dd93cfb8870e331b62089be62bf13202ee8df`), папка
`Data/modules/fxmaster` заменяется целиком. Манифест-зеркало — [fxmaster/module.json](../fxmaster/module.json),
от официального он отличается только полями `manifest` и `download`.

**Официальный манифест автора** (если GitHub отдаёт upstream): Manifest URL

```
https://github.com/ghost-fvtt/fxmaster/releases/download/v5.0.1/module.json
```

**Офлайн.** Скачать `fxmaster-5.0.1.zip` из [Releases](https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases)
и распаковать в `Data/modules/fxmaster` (старую папку предварительно сохранить).

После установки в **Settings → Manage Modules** у FXMaster должна стоять версия **5.0.1**.
Модули 7.x и 8.x для этого мира не подходят.

## 3. Проверка

1. В консоли (F12), войдя как GM:

   ```js
   game.modules.get("fxmaster")?.version   // "5.0.1"
   game.modules.get("fxmaster")?.active    // true
   ```

2. Флаги сцены должны совпадать с [reference/scene-flags.json](../fxmaster/reference/scene-flags.json):

   ```js
   const s = game.scenes.get("Uicwxtf2pNEmjfaS");
   console.log(JSON.stringify(s.getFlag("fxmaster", "effects"), null, 2));
   ```

3. Откройте сцену **New York** `Uicwxtf2pNEmjfaS` — не `KWZLXPdY2sQ8tVDu`: это вторая сцена с тем же
   именем, эффектов в ней нет.
4. Перезапустите Foundry и повторите п. 1–2: флаги и версия должны сохраниться.

Эталонные значения (они уже лежат в мире релиза 1.1.0):

| Эффект | scale | direction | speed | lifetime | density | alpha |
|---|---:|---:|---:|---:|---:|---:|
| `core_snowstorm` (снег) | 0.3 | 90 | 0.5 | 5 | 0.8 | 1 |
| `core_clouds` (облака) | 1.2 | 90 | 0.6 | 5 | 0.099 | 1 |

`tint` в обоих случаях выключен (`apply: false`, `#ffffff`).

## 4. Если флаги сцены всё-таки отличаются

Вставить целиком содержимое [set-snow-reference.js](../fxmaster/set-snow-reference.js) в консоль
Foundry (GM, мир запущен). Скрипт печатает версию ядра и модуля, состояние флагов «ДО» и «ПОСЛЕ» и
строку `СОВПАДАЕТ С ЭТАЛОНОМ: true/false`. Меняется только `flags.fxmaster.effects` одной сцены
`Uicwxtf2pNEmjfaS`; FXMaster перерисовывает эффекты сам по хуку `updateScene`.

В релизе 1.1.0 этот шаг не нужен: `world.zip` уже содержит эталонные флаги (sha256 архива
`55c560835d33a1b4b45262c27801a5b00e69e17e4ddeb76aa5b4481434faade2` совпадает с ассетом релиза, а
значения проверены в собранном мире).

## 5. Откат

- **Вернуть FXMaster 8.x:** Setup → Add-on Modules → Install Module → официальный манифест 8.x.
  Флаги сцены при этом не меняются.
- **Вернуть флаги сцены:** значение из строки `ДО:` в выводе скрипта либо
  `await game.scenes.get("Uicwxtf2pNEmjfaS").update({ "flags.fxmaster.effects": <старое значение> })`.
- Мир, модуль ассетов, система и остальные модули этим руководством не затрагиваются.

## 6. Происхождение архива и лицензия

FXMaster — Johannes Loher (ghost), Emmanuel Ruaud (U~man). Программная часть распространяется по
BSD 3-Clause; полный текст и перечень сторонних ресурсов — в `LICENSE.md` внутри архива, он не
изменялся. Архив не пересобирался и не переименовывался внутри, поэтому хеш совпадает с официальным
релизом v5.0.1.

## 7. Что не проверено

- Визуальное сравнение «эталон / хост»: требует живого запуска Foundry на обоих концах.
- Установка модуля через ссылку из этого репозитория на чистой установке Foundry не прогонялась —
  проверены только структура архива, манифест и совпадение хеша с официальным релизом.
