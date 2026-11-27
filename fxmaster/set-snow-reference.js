/* ==========================================================================
   FXMaster: эталонный снег и облака для сцены New York (Uicwxtf2pNEmjfaS)
   --------------------------------------------------------------------------
   Куда: Foundry VTT -> F12 -> вкладка Console, войти как GM, запустить мир.
   Что делает: записывает в флаги сцены ровно те эффекты, что стоят в
   эталонной десктопной установке (Foundry 12.331 + FXMaster 5.0.1), и сверяет
   результат. Ничего, кроме flags.fxmaster.effects этой одной сцены, не меняется.
   Подробности и откат: docs/FXMASTER-SNOW.md
   ========================================================================== */

const SCENE_ID = "Uicwxtf2pNEmjfaS";

const REFERENCE = {
  core_snowstorm: {
    type: "snowstorm",
    options: {
      scale: 0.3,
      direction: 90,
      speed: 0.5,
      lifetime: 5,
      density: 0.8,
      alpha: 1,
      tint: { apply: false, value: "#ffffff" },
    },
  },
  core_clouds: {
    type: "clouds",
    options: {
      scale: 1.2,
      direction: 90,
      speed: 0.6,
      lifetime: 5,
      density: 0.099,
      alpha: 1,
      tint: { apply: false, value: "#ffffff" },
    },
  },
};

const canon = (v) =>
  Array.isArray(v)
    ? "[" + v.map(canon).join(",") + "]"
    : v && typeof v === "object"
    ? "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}"
    : JSON.stringify(v);

const mod = game.modules.get("fxmaster");
console.log("Foundry:", game.release.version, "build", game.release.build);
console.log("FXMaster:", mod?.version ?? "<не установлен>", "| active:", mod?.active ?? false);

const scene = game.scenes.get(SCENE_ID);
if (!scene) throw new Error("Сцена не найдена: " + SCENE_ID);
console.log("Сцена:", scene.name, "|", scene.id, "|", scene.width + "x" + scene.height);
console.log("ДО:", JSON.stringify(scene.getFlag("fxmaster", "effects") ?? null));

await scene.update({ "flags.fxmaster.effects": REFERENCE }, { render: false });

const after = scene.getFlag("fxmaster", "effects");
console.log("ПОСЛЕ:", JSON.stringify(after));
console.log("СОВПАДАЕТ С ЭТАЛОНОМ:", canon(after) === canon(REFERENCE));

/* Если сцена сейчас открыта, FXMaster перерисует эффекты сам (хук updateScene).
   Если нет — откройте сцену New York и проверьте визуально. */
