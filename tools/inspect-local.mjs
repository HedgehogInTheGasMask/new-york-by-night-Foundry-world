// Read-only inventory of the local Foundry installation: packages, manifests,
// and a search for the files the audit could not resolve.
import fs from 'node:fs';
import path from 'node:path';

const DATA = process.env.FOUNDRY_DATA
  || path.join(process.env.LOCALAPPDATA || '', 'FoundryVTT', 'Data');
const out = { data: DATA, modules: [], systems: [], missing: {}, monks: null };

const readJSON = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

function packageInfo(dir, kind) {
  const m = readJSON(path.join(dir, 'module.json')) || readJSON(path.join(dir, 'system.json'))
    || readJSON(path.join(dir, 'world.json'));
  if (!m) return null;
  return {
    kind,
    dir: path.basename(dir),
    id: m.id,
    title: m.title,
    version: m.version,
    manifest: m.manifest || null,
    download: m.download || null,
    compatibility: m.compatibility || null,
    minimumCoreVersion: m.minimumCoreVersion || null,
    relationships: m.relationships || null,
    license: m.license || null,
    authors: m.authors || null,
    url: m.url || null,
    packs: (m.packs || []).length,
  };
}

for (const kind of ['modules', 'systems']) {
  const base = path.join(DATA, kind);
  if (!fs.existsSync(base)) continue;
  for (const e of fs.readdirSync(base, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const info = packageInfo(path.join(base, e.name), kind);
    if (info) out[kind].push(info);
  }
}

// ---- known-missing playlists: search every filename under Data (assets, modules, worlds)
const wanted = [
  /out of sight/i,
  /unhealed/i,
  /knights.*bishops/i,
  /maenad/i,
];
const hits = [];
let scanned = 0;
const walk = (dir, depth = 0) => {
  if (depth > 8) return;
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    scanned++;
    if (e.isDirectory()) { walk(p, depth + 1); continue; }
    if (wanted.some((re) => re.test(e.name))) {
      let size = 0;
      try { size = fs.statSync(p).size; } catch {}
      hits.push({ path: path.relative(DATA, p).replace(/\\/g, '/'), size });
    }
  }
};
for (const sub of ['assets', 'modules', 'worlds', 'music', 'sounds']) {
  const p = path.join(DATA, sub);
  if (fs.existsSync(p)) walk(p);
}
out.missing = { scannedFiles: scanned, hits };

// ---- Monk's Enhanced Journal icons
const monksDir = path.join(DATA, 'modules/monks-enhanced-journal');
if (fs.existsSync(monksDir)) {
  const assets = path.join(monksDir, 'assets');
  out.monks = {
    version: (readJSON(path.join(monksDir, 'module.json')) || {}).version || null,
    assetsExists: fs.existsSync(assets),
    pngAtRoot: fs.existsSync(assets)
      ? fs.readdirSync(assets).filter((f) => /\.(png|webp|svg|jpg)$/i.test(f)).slice(0, 40)
      : [],
    hasTextPng: fs.existsSync(path.join(assets, 'text.png')),
    hasVideoPng: fs.existsSync(path.join(assets, 'video.png')),
  };
  // where do those icon names actually live in this version?
  const found = [];
  const walk2 = (dir, depth = 0) => {
    if (depth > 6) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk2(p, depth + 1);
      else if (/^(text|video)\.(png|webp|svg)$/i.test(e.name)) found.push(path.relative(monksDir, p).replace(/\\/g, '/'));
    }
  };
  walk2(monksDir);
  out.monks.iconCandidates = found.slice(0, 20);
}

fs.writeFileSync(path.resolve(import.meta.dir, '../audit/local-packages.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
