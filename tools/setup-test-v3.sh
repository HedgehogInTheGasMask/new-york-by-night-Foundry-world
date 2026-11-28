#!/usr/bin/env bash
# Prepare a clean Foundry data directory for the 3.0.0 clean-install test.
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT=$(cd .. && pwd)
BASE="$ROOT/test-foundry/v3"
TAG_URL="https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases/download/v3.0.0"
LATEST_URL="https://github.com/HedgehogInTheGasMask/new-york-by-night-Foundry-world/releases/latest/download"

rm -rf "$BASE/Data/worlds" "$BASE/world.zip"
mkdir -p "$BASE/Data/modules" "$BASE/Data/systems" "$BASE/Data/worlds" "$BASE/Config"

echo "== system and license"
[ -d "$BASE/Data/systems/worldofdarkness" ] || cp -r "$ROOT/test-foundry/data/Data/systems/." "$BASE/Data/systems/"
cp "$ROOT/test-foundry/data/Config/license.json" "$BASE/Config/" 2>/dev/null

echo "== modules"
if [ ! -d "$BASE/Data/modules/goldwater-assets" ]; then
  unzip -qo dist/goldwater-assets.zip -d "$BASE/Data/modules/"
  unzip -qo dist/fxmaster-5.0.1.zip -d "$BASE/Data/modules/"
  cp -r "$ROOT/test-foundry/data/Data/modules/token-variants" "$BASE/Data/modules/"
  cp -r "$ROOT/test-foundry/data/Data/modules/lib-wrapper" "$BASE/Data/modules/" 2>/dev/null
  cp -r "$ROOT/test-foundry/data/Data/modules/monks-enhanced-journal" "$BASE/Data/modules/" 2>/dev/null
fi
echo "modules:"; ls "$BASE/Data/modules"

echo "== world manifest and archive from the release URL"
curl -fsSL "$LATEST_URL/world.json" -o "$BASE/world-manifest.json" || { echo "manifest download FAILED"; exit 1; }
curl -fsSL "$LATEST_URL/world.zip" -o "$BASE/world.zip" || { echo "world.zip download FAILED"; exit 1; }
ls -l "$BASE/world.zip"
sha256sum "$BASE/world.zip"

echo "== extract world like Foundry does"
mkdir -p "$BASE/Data/worlds/goldwater-cuckold"
unzip -qo "$BASE/world.zip" -d "$BASE/Data/worlds/goldwater-cuckold"
ls "$BASE/Data/worlds/goldwater-cuckold"
find "$BASE/Data/worlds/goldwater-cuckold/assets/tokens" -name "*.png" | wc -l

echo "== options.json"
cat > "$BASE/Config/options.json" <<JSON
{
  "dataPath": "${BASE//\//\\\\}",
  "compressStatic": true,
  "fullscreen": false,
  "hostname": "127.0.0.1",
  "language": "en.core",
  "localHostname": "127.0.0.1",
  "port": 30124,
  "protocol": null,
  "proxyPort": null,
  "proxySSL": false,
  "routePrefix": null,
  "updateChannel": "stable",
  "upnp": false,
  "upnpLeaseDuration": null,
  "awsConfig": null,
  "compressSocket": true,
  "cssTheme": "foundry",
  "deleteNEDB": false,
  "hotReload": false,
  "passwordSalt": null,
  "sslCert": null,
  "sslKey": null,
  "world": "goldwater-cuckold",
  "serviceConfig": null,
  "telemetry": false
}
JSON
echo "== setup done"
