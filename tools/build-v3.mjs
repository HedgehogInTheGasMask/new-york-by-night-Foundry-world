// Build Goldwater cuckold 3.0.0:
//  - removes scenes whose background lives in a paid module that cannot ship,
//  - removes every snow effect (keeps clouds/fog),
//  - replaces actor tokens with the New York by Night token library and registers
//    alternative art as real Token Variant Art variants,
//  - rewrites asset paths into the goldwater-assets module and declares dependencies.
//
// The live world is never modified: it is copied, and a backup is written first.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ClassicLevel } from 'classic-level';
import { makeZip } from './zip.mjs';

const ROOT = path.resolve(import.meta.dir, '..');
const LIVE = process.env.WORLD_DIR
  || 'C:/Users/user1/AppData/Local/FoundryVTT/Data/worlds/goldwater-cuckold';
const BACKUP_ROOT = process.env.BACKUP_DIR
  || 'C:/Users/user1/AppData/Local/FoundryVTT/_parity-backups/2026-11-28';
const QWE = 'C:/Users/user1/Desktop/qwe';
const VERSION = '3.0.0';
const MODULE_VERSION = '1.0.0';
const WORLD_ID = 'goldwater-cuckold';

const REPO = 'https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world';
const LATEST = `${REPO}/releases/latest/download`;

const BUILD = path.join(ROOT, 'build/world-v3');
const STAGE_TOKENS = path.join(ROOT, 'build/tokens');
const OUT = path.join(ROOT, 'dist', `v${VERSION}`);

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const fail = (m) => { throw new Error(m); };
const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').replace(/[«»"'`]/g, '').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- backup
fs.mkdirSync(BACKUP_ROOT, { recursive: true });
const BACKUP = path.join(BACKUP_ROOT, `world-${WORLD_ID}`);
if (!fs.existsSync(path.join(BACKUP, 'world.json'))) {
  console.log('backing up live world ->', BACKUP);
  fs.cpSync(LIVE, BACKUP, { recursive: true, filter: (s) => !s.endsWith('LOCK') });
} else {
  console.log('backup already present ->', BACKUP);
}

// ---------------------------------------------------------------- working copy
fs.rmSync(BUILD, { recursive: true, force: true });
fs.mkdirSync(BUILD, { recursive: true });
for (const c of ['data', 'packs', 'assets']) {
  if (fs.existsSync(path.join(LIVE, c))) fs.cpSync(path.join(LIVE, c), path.join(BUILD, c), { recursive: true });
}
fs.copyFileSync(path.join(LIVE, 'world.json'), path.join(BUILD, 'world.json'));

const stripLocks = (d) => {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) stripLocks(p);
    else if (e.name === 'LOCK') fs.rmSync(p, { force: true });
  }
};
stripLocks(path.join(BUILD, 'data'));
stripLocks(path.join(BUILD, 'packs'));

// ---------------------------------------------------------------- token library
const readmePath = path.join(STAGE_TOKENS, 'vtm_ny2000/README.txt');
if (!fs.existsSync(readmePath)) {
  fs.rmSync(STAGE_TOKENS, { recursive: true, force: true });
  fs.mkdirSync(STAGE_TOKENS, { recursive: true });
  for (const z of ['vtm_ny2000_part1.zip', 'vtm_ny2000_part2.zip']) {
    execFileSync('unzip', ['-qo', path.join(QWE, z), '-d', STAGE_TOKENS], { stdio: 'inherit' });
  }
}
const readme = fs.readFileSync(readmePath, 'utf8');
const sizes = new Map();
const names = new Map();
for (const line of readme.split(/\r?\n/)) {
  const m = line.match(/^(\S+\.png) — (.+?) \(токен ([\d.]+)×([\d.]+)\)/);
  if (!m) continue;
  sizes.set(m[1], { w: Number(m[3]), h: Number(m[4]) });
  names.set(m[1], m[2]);
}
const TOKEN_ROOT = path.join(STAGE_TOKENS, 'vtm_ny2000');
const files = [];
for (const cat of fs.readdirSync(TOKEN_ROOT, { withFileTypes: true })) {
  if (!cat.isDirectory()) continue;
  for (const f of fs.readdirSync(path.join(TOKEN_ROOT, cat.name))) {
    if (!f.endsWith('.png')) continue;
    files.push({ cat: cat.name, file: f, id: f.replace(/\.png$/, ''), name: names.get(f) ?? f });
  }
}
const byBase = new Map();
const baseOf = (id) => id.replace(/_(noitems|noweapon|plain|casual|v1)$/, '');
for (const f of files) {
  const b = baseOf(f.id);
  if (!byBase.has(b)) byBase.set(b, []);
  byBase.get(b).push(f);
}
for (const list of byBase.values()) list.sort((a, b) => a.id.localeCompare(b.id));
const pickMain = (base) => {
  const list = byBase.get(base);
  if (!list) return null;
  return list.find(f => f.id === `${base}_noitems`)
    ?? list.find(f => f.id === `${base}_noweapon`)
    ?? list.find(f => f.id === `${base}_plain`)
    ?? list.find(f => f.id === base)
    ?? list[0];
};
console.log('token library:', files.length, 'files,', byBase.size, 'characters');

// ---------------------------------------------------------------- canonical mapping
// Names as they appear in the world -> library base id. Verified against the HTML
// token list and the New York by Night character roster.
const CANON = {
  // main / player characters
  'алан персон': 'alan_person',
  'генри чапман': 'henry_chapman',
  'дезмонд лерой маккей': 'desmond_mckay',
  'джон граммэр': 'john_grammer',
  'майк росс': 'mike_ross',
  'ансельмо джованни': 'anselmo_giovanni',
  'джейсон кроули': 'jason_crowley',
  'вкид': 'vkid',
  'вась': 'vas',
  'слендермен': 'slenderman',
  'маттео': 'matteo_ghost',
  // New York by Night
  'кэтрин вайс': 'katherine_weiss',
  'тео белл': 'theo_bell',
  'элизабет хорсманден марлена': 'elizabeth_horsmanden',
  'элизабет хорсманден': 'elizabeth_horsmanden',
  'тэйшон кёрнс': 'tayshawn_kearns',
  'валентин': 'valentin',
  'диана вик': 'diana_vick',
  'джезебель': 'jezebel',
  'дэвид морган': 'david_morgan',
  'картер вандервейден': 'carter_vandervelden',
  'аделаида дэвис': 'adelaide_davis',
  'калеброс': 'calebros',
  'жерар рафен': 'gerard_raffin',
  'близняшка': 'twinsie',
  'крид': 'creed',
  'кадир аль-асмей': 'qadir_al_asmei',
  'иветта печальная': 'yvette_the_sad',
  'эшлинг стёрбридж': 'aisling_starbridge',
  'эйслинг старбридж': 'aisling_starbridge',
  'эугенио эстевес': 'eugenio_estevez',
  'лорд эфраим уэйнрайт': 'ephraim_wainwright',
  'масика сейнт-джон': 'masika_saint_john',
  'фербрух': 'verbruch',
  'мазз': 'mazz',
  'томас артуро': 'thomas_arturo',
  'хелен панард': 'helena_penhard',
  'хелена пенхард': 'helena_penhard',
  'николас чанг': 'nicholas_chang',
  'дино черутти': 'dino_cerutti',
  'винс черутти': 'vince_cerutti',
  'босс каллихан': 'boss_callahan',
  'франсиско доминго де полонья': 'francisco_de_polonia',
  'эстер рид': 'esther_reed',
  'рюрик ракоши': 'ruryk_rakoczy',
  'рашид стоктон': 'rashid_stockton',
  'кэнди кейн': 'candy_kane',
  'джонатан гарсел': 'jonathan_garsel',
  'стивен кларк': 'stephen_clark',
  'сун ян мудрая лягушка': 'sun_yang',
  'сун ян': 'sun_yang',
  'донателло джованни': 'donatello_giovanni',
  'без дансирн': 'bez_dansirn',
  'майкл невельсон': 'michael_nevelson',
  'жанна невельсон': 'jeanne_nevelskaya',
  'бобби прайд': 'bobby_pride',
};
// Explicit role mapping for non-canonical actors whose name states what they are.
const ROLE = {
  'птенец бруха': 'brujah_girl',
  'птенец ассамит': 'assamite',
  'птенец гангрел': 'gangrel',
  'птенец тзимисце': 'shovelhead',
  'оборотень': 'garou_glabro',
  'вампир': 'ventrue',
  'гончая тзимисце': 'tzimisce_hound',
  'гуль': 'ghoul_feral',
};
// Actors whose own art is unique and for which the library has no portrait: keep as-is.
const KEEP = new Set([
  'белль экитон', 'белль экитон copy', 'топкэт', 'топкэт copy',
  'джим гандер', 'джим гандер copy', 'яхмос чеймберс', 'яхмос чеймберс copy',
  'сахира сираж', 'эли сансарик', 'bogatyr', 'байк',
]);

// Gendered pools so a random passer-by is not given a token of the wrong sex.
const FEMALE = ['businesswoman', 'passer_woman_coat', 'old_woman', 'nurse', 'student',
  'club_girl_red', 'club_girl_leather', 'goth_girl', 'raver_girl', 'malkavian_girl',
  'brujah_girl', 'gangrel_wild', 'ventrue_lady', 'toreador_diva', 'setite_priestess',
  'streetwalker', 'junkie_woman', 'cacophony', 'salubri', 'imbued'];
const MALE = ['office_clerk', 'homeless', 'cop_nypd', 'doctor', 'priest', 'construction',
  'security_guard', 'jogger', 'thug_hoodie', 'gangster_track', 'junkie', 'dealer',
  'mafioso', 'mafia_don', 'russian_mob', 'triad', 'hitman', 'gang_biker', 'robber_mask',
  'bouncer_crossed', 'bouncer_suit', 'raver_guy', 'goth_guy', 'dj', 'bartender', 'punk',
  'cybergoth', 'clubber_silk', 'ventrue', 'toreador', 'brujah', 'tremere', 'malkavian',
  'nosferatu', 'nosferatu_informer', 'gangrel', 'caitiff', 'giovanni', 'giovanni_necro',
  'setite', 'assamite', 'ravnos', 'samedi', 'lasombra_priest', 'tzimisce_noble',
  'shovelhead', 'sabbat_punk', 'black_hand', 'sabbat_bishop', 'sabbat_templar', 'kiasyd',
  'harbinger', 'baali', 'ghoul_butler', 'ghoul_chauffeur', 'ghoul_feral', 'bratovich',
  'grimaldi', 'zantosa', 'obertus', 'leopold_inquisitor', 'leopold_soldier', 'hunter_stake',
  'mib_technocrat', 'swat', 'hermetic_mage', 'faith_priest', 'kuei_jin', 'jiangshi'];
const NEUTRAL = ['detective', 'cop_aiming', 'fbi_agent', 'security_guard', 'nurse'];

// First names present in the world that read as female.
const FEMALE_NAMES = new Set(['мия', 'джулия', 'ариа', 'софия', 'грейс', 'эмма', 'лили',
  'эмили', 'приа', 'яра', 'оливия', 'изабелла', 'ава', 'валерия', 'аиша', 'тяжёлая мама',
  'сахира', 'белль']);

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------- read databases
async function withDb(dir, fn) {
  const db = new ClassicLevel(dir, { keyEncoding: 'buffer', valueEncoding: 'buffer' });
  await db.open();
  try { return await fn(db); } finally { await db.close(); }
}

const dataDirs = fs.readdirSync(path.join(BUILD, 'data'), { withFileTypes: true })
  .filter(e => e.isDirectory()).map(e => path.join(BUILD, 'data', e.name));
const packDirs = fs.existsSync(path.join(BUILD, 'packs'))
  ? fs.readdirSync(path.join(BUILD, 'packs'), { withFileTypes: true })
    .filter(e => e.isDirectory()).map(e => path.join(BUILD, 'packs', e.name))
  : [];

// ---------------------------------------------------------------- scenes
const folderNames = new Map();
await withDb(path.join(BUILD, 'data/folders'), async (db) => {
  for await (const [, v] of db.iterator()) {
    const d = JSON.parse(v.toString('utf8'));
    folderNames.set(d._id, d);
  }
});

const PAID_PREFIX = /^modules\/tom-?cartos/i;
const removedScenes = [];
const keptScenes = [];
await withDb(path.join(BUILD, 'data/scenes'), async (db) => {
  const removals = new Set();
  const updates = new Map();
  const effectsRemoved = [];
  const weatherCleared = [];

  // first pass: decide which scenes stay
  for await (const [k, v] of db.iterator()) {
    const key = k.toString('utf8');
    if (!/^!scenes![^.]+$/.test(key)) continue;
    const doc = JSON.parse(v.toString('utf8'));
    const bg = doc.background?.src ?? null;
    const reason = !bg
      ? 'фон не задан (пустая сцена)'
      : PAID_PREFIX.test(bg)
        ? 'фон из платного модуля Tom Cartos, который нельзя распространять'
        : null;
    if (reason) {
      removedScenes.push({ id: doc._id, name: doc.name, background: bg, reason });
      removals.add(doc._id);
      continue;
    }

    let changed = false;
    // snow removal only; clouds and fog stay
    const fx = doc.flags?.fxmaster;
    if (fx?.effects) {
      for (const [id, eff] of Object.entries(fx.effects)) {
        const type = String(eff?.type ?? '').toLowerCase();
        if (/snow|blizzard|hail|sleet/.test(type) || /snow|blizzard|hail|sleet/.test(id)) {
          delete fx.effects[id];
          effectsRemoved.push({ scene: doc.name, id, type: eff?.type });
          changed = true;
        }
      }
    }
    if (typeof doc.weather === 'string' && /snow|blizzard|hail|sleet/i.test(doc.weather)) {
      weatherCleared.push({ scene: doc.name, was: doc.weather });
      doc.weather = '';
      changed = true;
    }
    if (changed) updates.set(k, Buffer.from(JSON.stringify(doc), 'utf8'));
    keptScenes.push({ id: doc._id, name: doc.name, background: bg });
  }

  // second pass: drop the removed scenes and everything embedded in them
  const b = db.batch();
  let deletedKeys = 0;
  for await (const [k] of db.iterator()) {
    const key = k.toString('utf8');
    const top = key.match(/^!scenes!([^.]+)$/);
    const emb = key.match(/^!scenes\.[a-z]+!([^.]+)\./);
    const fog = key.match(/^!fog!([^.]+)$/);
    if ((top && removals.has(top[1])) || (emb && removals.has(emb[1])) || (fog && removals.has(fog[1]))) {
      b.del(k);
      deletedKeys++;
    }
  }
  for (const [k, v] of updates) b.put(k, v);
  await b.write();
  console.log('deleted scene records:', deletedKeys);
  console.log('scenes kept', keptScenes.length, 'removed', removedScenes.length);
  console.log('snow effects removed', effectsRemoved.length, 'weather cleared', weatherCleared.length);
  fs.writeFileSync(path.join(ROOT, 'audit/v3-scenes.json'), JSON.stringify({ keptScenes, removedScenes, effectsRemoved, weatherCleared }, null, 2));
});

// ---------------------------------------------------------------- actors
const femalePool = seededShuffle(FEMALE.filter(id => byBase.has(id)), 20261128);
const malePool = seededShuffle(MALE.filter(id => byBase.has(id)), 20261128);
let fi = 0, mi = 0;
const nextFemale = () => femalePool[fi++ % femalePool.length];
const nextMale = () => malePool[mi++ % malePool.length];

const isFemaleName = (name) => {
  const first = norm(name).split(' ')[0];
  return FEMALE_NAMES.has(first);
};

const TOKEN_DIR = 'assets/tokens/vtm_ny2000';
const tokenPath = (f) => `worlds/${WORLD_ID}/${TOKEN_DIR}/${f.cat}/${encodeURIComponent(f.file).replace(/%2F/g, '/')}`;

const actorReport = [];
const missingFiles = [];
await withDb(path.join(BUILD, 'data/actors'), async (db) => {
  const b = db.batch();
  const docs = [];
  for await (const [k, v] of db.iterator()) {
    const key = k.toString('utf8');
    if (/^!actors![^.]+$/.test(key)) docs.push([k, JSON.parse(v.toString('utf8'))]);
  }
  docs.sort((a, b2) => a[1].name.localeCompare(b2[1].name, 'ru'));

  for (const [k, doc] of docs) {
    const folder = folderNames.get(doc.folder)?.name ?? '';
    const n = norm(doc.name);
    const before = doc.prototypeToken?.texture?.src ?? null;
    let entry = { actor: doc.name, folder, type: doc.type, before, main: null, variants: [], basis: '', changed: false };

    if (KEEP.has(n)) {
      entry.basis = 'в библиотеке нет изображения этого персонажа — оставлено прежнее';
      actorReport.push(entry);
      continue;
    }

    let base = null;
    let basis = '';
    if (CANON[n]) { base = CANON[n]; basis = 'точное совпадение имени с библиотекой токенов'; }
    else if (ROLE[n]) { base = ROLE[n]; basis = 'роль указана в имени персонажа'; }
    else {
      const clust = /Random asspull/i.test(folder) ? 'random'
        : /Brute Squad/i.test(folder) ? 'brute'
          : /\(cuck\)old/i.test(folder) ? 'old'
            : 'other';
      const female = isFemaleName(doc.name);
      base = female ? nextFemale() : nextMale();
      basis = clust === 'random'
        ? `случайный NPC: ${female ? 'женский' : 'мужской'} токен по полу, одежде и роли`
        : clust === 'brute'
          ? `неканонический NPC: ${female ? 'женский' : 'мужской'} уличный/клан-токен по роли`
          : clust === 'old'
            ? `неканонический персонаж: ${female ? 'женский' : 'мужской'} токен по полу и роли`
            : `нет канонического изображения: ${female ? 'женский' : 'мужской'} токен по полу и роли`;
    }

    const main = pickMain(base);
    if (!main) { entry.basis = `не найден токен ${base}`; actorReport.push(entry); continue; }
    const variants = byBase.get(base) ?? [main];

    doc.prototypeToken = doc.prototypeToken ?? {};
    doc.prototypeToken.texture = doc.prototypeToken.texture ?? {};
    doc.prototypeToken.texture.src = tokenPath(main);

    const size = sizes.get(main.file)?.w ?? 1;
    if (size !== 1) {
      const grid = Math.ceil(size);
      doc.prototypeToken.width = grid;
      doc.prototypeToken.height = grid;
      doc.prototypeToken.texture.scaleX = Number((size / grid).toFixed(3));
      doc.prototypeToken.texture.scaleY = Number((size / grid).toFixed(3));
    } else {
      doc.prototypeToken.width = 1;
      doc.prototypeToken.height = 1;
      doc.prototypeToken.texture.scaleX = 1;
      doc.prototypeToken.texture.scaleY = 1;
    }

    doc.flags = doc.flags ?? {};
    doc.flags['token-variants'] = doc.flags['token-variants'] ?? {};
    doc.flags['token-variants'].variants = variants.map(f => ({
      imgSrc: tokenPath(f),
      names: [doc.prototypeToken.name || doc.name],
    }));

    entry.main = main.id;
    entry.variants = variants.map(f => f.id);
    entry.basis = basis;
    entry.size = size;
    entry.changed = true;
    actorReport.push(entry);
    b.put(k, Buffer.from(JSON.stringify(doc), 'utf8'));
  }
  await b.write();
});
const changedActors = actorReport.filter(a => a.changed);
console.log('actors', actorReport.length, 'retokened', changedActors.length,
  'with variants', changedActors.filter(a => a.variants.length > 1).length,
  'variant images', changedActors.reduce((n, a) => n + Math.max(0, a.variants.length - 1), 0));

// ---------------------------------------------------------------- copy token art into the world
const usedFiles = new Set();
for (const a of changedActors) for (const id of a.variants) {
  const f = files.find(x => x.id === id);
  if (f) usedFiles.add(f);
}
for (const f of usedFiles) {
  const dst = path.join(BUILD, TOKEN_DIR, f.cat, f.file);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(path.join(TOKEN_ROOT, f.cat, f.file), dst);
}
console.log('token files copied into world:', usedFiles.size);

// ---------------------------------------------------------------- path rewrites
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/plan.json'), 'utf8'));
const seen = new Set();
const repl = plan.rewrites
  .filter(r => !seen.has(r.raw) && seen.add(r.raw))
  .map(r => ({ raw: r.raw, newRaw: r.newRaw }))
  .filter(r => r.raw !== r.newRaw)
  .sort((a, b2) => b2.raw.length - a.raw.length);
const rewriteText = (s) => {
  let out = s;
  for (const r of repl) if (out.includes(r.raw)) out = out.split(r.raw).join(r.newRaw);
  return out;
};

let entries = 0, rewritten = 0, settingDocs = 0;
for (const dir of [...dataDirs, ...packDirs]) {
  await withDb(dir, async (db) => {
    const b = db.batch();
    let n = 0, c = 0;
    for await (const [k, v] of db.iterator()) {
      n++;
      const text = v.toString('utf8');
      let next = rewriteText(text);
      if (dir.endsWith(`${path.sep}settings`)) {
        try {
          const doc = JSON.parse(text);
          if (doc?.key === 'core.moduleConfiguration' && typeof doc.value === 'string') {
            const cfg = JSON.parse(doc.value);
            for (const id of Object.keys(cfg)) if (/^tom-?cartos/i.test(id)) delete cfg[id];
            for (const id of ['goldwater-assets', 'fxmaster', 'token-variants', 'monks-enhanced-journal']) cfg[id] = true;
            doc.value = JSON.stringify(cfg);
            next = JSON.stringify(doc);
            settingDocs++;
          }
        } catch { /* not the document we care about */ }
      }
      if (next !== text) { b.put(k, Buffer.from(next, 'utf8')); c++; }
    }
    if (c) await b.write();
    entries += n; rewritten += c;
  });
}
stripLocks(path.join(BUILD, 'data'));
stripLocks(path.join(BUILD, 'packs'));
if (settingDocs !== 1) fail(`expected exactly one core.moduleConfiguration document, found ${settingDocs}`);

// ---------------------------------------------------------------- repair dead references
// Two defects predate this release and would show up as broken images/audio in a fresh
// install: stair notes use an icon Foundry does not ship, and a playlist keeps three
// tracks whose files are gone from every asset folder.
const CORE_PUBLIC = 'C:/Program Files/Foundry Virtual Tabletop/resources/app/public';
const DATA_ROOT = 'C:/Users/user1/AppData/Local/FoundryVTT/Data';
const STAIRS_ICON = 'icons/environment/settlement/stone-stairs.webp';
const existsForPath = (p) => {
  const clean = (() => { try { return decodeURI(p); } catch { return p; } })();
  const map = [
    [`worlds/${WORLD_ID}/`, BUILD],
    ['modules/goldwater-assets/', path.join(ROOT, 'build/goldwater-assets')],
    ['icons/', path.join(CORE_PUBLIC, 'icons')],
    ['ui/', path.join(CORE_PUBLIC, 'ui')],
    ['sounds/', path.join(CORE_PUBLIC, 'sounds')],
    ['systems/worldofdarkness/', path.join(DATA_ROOT, 'systems/worldofdarkness')],
  ];
  for (const [pre, dir] of map) if (clean.startsWith(pre)) return fs.existsSync(path.join(dir, clean.slice(pre.length)));
  return null;
};

const isMissingRef = (p) => {
  const r = existsForPath(p);
  if (r === false) return true;
  if (r === null) {
    const clean = (() => { try { return decodeURI(p); } catch { return p; } })();
    return !/^(modules|systems|worlds\/|icons\/|ui\/|sounds\/|http|data:)/.test(clean);
  }
  return false;
};

const repaired = { notes: [], playlistSounds: [] };
await withDb(path.join(BUILD, 'data/scenes'), async (db) => {
  const b = db.batch();
  for await (const [k, v] of db.iterator()) {
    const key = k.toString('utf8');
    if (!/^!scenes\.(notes|tiles)!/.test(key)) continue;
    const doc = JSON.parse(v.toString('utf8'));
    const src = doc.texture?.src ?? doc.icon;
    if (typeof src === 'string' && isMissingRef(src)) {
      repaired.notes.push({ was: src, text: doc.text });
      if (doc.texture) doc.texture.src = STAIRS_ICON; else doc.icon = STAIRS_ICON;
      b.put(k, Buffer.from(JSON.stringify(doc), 'utf8'));
    }
  }
  await b.write();
});

await withDb(path.join(BUILD, 'data/playlists'), async (db) => {
  const b = db.batch();
  const playlists = new Map();
  const dead = new Set();
  for await (const [k, v] of db.iterator()) {
    const key = k.toString('utf8');
    const doc = JSON.parse(v.toString('utf8'));
    const top = key.match(/^!playlists!([^.]+)$/);
    if (top) { playlists.set(top[1], { key, doc }); continue; }
    if (/^!playlists\.sounds!/.test(key) && typeof doc.path === 'string' && isMissingRef(doc.path)) {
      dead.add(key);
      repaired.playlistSounds.push({ name: doc.name, path: doc.path });
    }
  }
  for (const key of dead) b.del(Buffer.from(key, 'utf8'));
  for (const [id, { key, doc }] of playlists) {
    if (!Array.isArray(doc.sounds)) continue;
    const before = doc.sounds.length;
    doc.sounds = doc.sounds.filter(sid => !dead.has(`!playlists.sounds!${id}.${sid}`));
    if (doc.sounds.length !== before) b.put(Buffer.from(key, 'utf8'), Buffer.from(JSON.stringify(doc), 'utf8'));
  }
  await b.write();
});
console.log('repaired notes', repaired.notes.length, 'dead playlist sounds', repaired.playlistSounds.length);

// ---------------------------------------------------------------- world descriptor
const descPath = path.join(BUILD, 'world.json');
const desc = JSON.parse(fs.readFileSync(descPath, 'utf8'));
const frozen = { id: desc.id, system: desc.system, title: desc.title, coreVersion: desc.coreVersion, packs: JSON.stringify(desc.packs) };
if (desc.id !== WORLD_ID) fail('unexpected world id');
if (desc.coreVersion !== '12.331') fail('unexpected coreVersion');
desc.version = VERSION;
desc.background = rewriteText(desc.background || '');
desc.compatibility = { minimum: '12', verified: '12.331' };
desc.relationships = {
  systems: [{ id: 'worldofdarkness', type: 'system', compatibility: { minimum: '4.2.12', verified: '4.2.12' } }],
  requires: [
    { id: 'goldwater-assets', type: 'module', manifest: `${LATEST}/module.json`, compatibility: { minimum: MODULE_VERSION, verified: MODULE_VERSION } },
    { id: 'fxmaster', type: 'module', manifest: `${LATEST}/fxmaster.json`, compatibility: { minimum: '5.0.1', maximum: '5.0.1' } },
    {
      id: 'token-variants', type: 'module',
      manifest: 'https://raw.githubusercontent.com/Aedif/TokenVariants/5.1.6/token-variants/module.json',
      compatibility: { minimum: '5.1.6', verified: '5.1.6' },
    },
  ],
  recommends: [
    { id: 'monks-enhanced-journal', type: 'module', manifest: 'https://raw.githubusercontent.com/ironmonk88/monks-enhanced-journal/12.02/module.json', compatibility: { minimum: '12', maximum: '12.99' }, reason: "Иконки страниц журналов Monk's Enhanced Journal." },
    { id: 'lib-wrapper', type: 'module', reason: 'Требуется модулем Token Variant Art.' },
  ],
  conflicts: [],
};
fs.writeFileSync(descPath, JSON.stringify(desc, null, 2) + '\n');
if (desc.id !== frozen.id || desc.system !== frozen.system || desc.title !== frozen.title
  || desc.coreVersion !== frozen.coreVersion || JSON.stringify(desc.packs) !== frozen.packs) {
  fail('world identity changed');
}
const releaseManifest = { ...desc };
delete releaseManifest.lastPlayed;
delete releaseManifest.playtime;
releaseManifest.type = 'world';
releaseManifest.manifest = `${LATEST}/world.json`;
releaseManifest.download = `${LATEST}/world.zip`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'world.json'), JSON.stringify(releaseManifest, null, 2) + '\n');

// ---------------------------------------------------------------- invariants + archive
const sceneStats = { scenes: 0, walls: 0, doors: 0, secretDoors: 0, lights: 0, tokens: 0, notes: 0, tiles: 0, sounds: 0, snow: 0 };
const snowLeft = [];
await withDb(path.join(BUILD, 'data/scenes'), async (db) => {
  for await (const [k, v] of db.iterator()) {
    const key = k.toString('utf8');
    const doc = JSON.parse(v.toString('utf8'));
    if (/^!scenes\.walls!/.test(key)) { if (doc.door === 1) sceneStats.doors++; else if (doc.door === 2) sceneStats.secretDoors++; sceneStats.walls++; }
    if (/^!scenes\.lights!/.test(key)) sceneStats.lights++;
    if (/^!scenes\.tokens!/.test(key)) sceneStats.tokens++;
    if (/^!scenes\.notes!/.test(key)) sceneStats.notes++;
    if (/^!scenes\.tiles!/.test(key)) sceneStats.tiles++;
    if (/^!scenes\.sounds!/.test(key)) sceneStats.sounds++;
    if (/^!scenes![^.]+$/.test(key)) {
      sceneStats.scenes++;
      const fx = doc.flags?.fxmaster?.effects ?? {};
      for (const [id, eff] of Object.entries(fx)) {
        if (/snow|blizzard|hail/i.test(String(eff?.type ?? '')) || /snow|blizzard|hail/i.test(id)) {
          sceneStats.snow++; snowLeft.push({ scene: doc.name, id });
        }
      }
      if (typeof doc.weather === 'string' && /snow|blizzard/i.test(doc.weather)) snowLeft.push({ scene: doc.name, weather: doc.weather });
    }
  }
});
if (sceneStats.scenes !== keptScenes.length) fail(`scene count ${sceneStats.scenes} != ${keptScenes.length}`);
if (sceneStats.snow !== 0 || snowLeft.length !== 0) fail(`snow left: ${JSON.stringify(snowLeft)}`);

fs.rmSync(path.join(OUT, 'world.zip'), { force: true });
const zip = makeZip(path.join(OUT, 'world.zip'), BUILD);

const report = {
  version: VERSION, moduleVersion: MODULE_VERSION,
  entries, rewritten,
  scenes: sceneStats,
  keptScenes: keptScenes.length,
  removedScenes: removedScenes.length,
  tokenFiles: usedFiles.size,
  actors: actorReport.length,
  retokened: changedActors.length,
  withVariants: changedActors.filter(a => a.variants.length > 1).length,
  variantImages: changedActors.reduce((n, a) => n + Math.max(0, a.variants.length - 1), 0),
  zip,
  sha256: { 'world.json': sha(fs.readFileSync(path.join(OUT, 'world.json'))), 'world.zip': sha(fs.readFileSync(path.join(OUT, 'world.zip'))) },
};
fs.writeFileSync(path.join(ROOT, 'audit/build-v3.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(ROOT, 'audit/v3-actors.json'), JSON.stringify(actorReport, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log('OK');
