#!/usr/bin/env bash
# Create the draft v3.0.0 release and upload its six assets.
# The release is left as a draft until the clean-install test passes.
set -uo pipefail
cd "$(dirname "$0")/.."

OWNER=HedgehogInTheGasMask
REPO=new-york-by-night-Foundry-world
TAG=v3.0.0
DIST=dist/v3.0.0
API="https://api.github.com/repos/$OWNER/$REPO"

GH_TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill | grep '^password=' | cut -d= -f2)
export GH_TOKEN
[ -z "$GH_TOKEN" ] && { echo "no token"; exit 1; }

auth=(-H "Authorization: token $GH_TOKEN" -H "Accept: application/vnd.github+json")

BUN=${BUN:-"C:/Users/user1/AppData/Local/Programs/@codebufffreebuff-desktop/resources/bun/bun.exe"}

echo "== find or create release $TAG"
RID=$(curl -s "${auth[@]}" "$API/releases/tags/$TAG" | grep -m1 '"id":' | tr -dc '0-9')
if [ -z "$RID" ]; then
  "$BUN" -e "const fs=require('fs');const body=fs.readFileSync('docs/RELEASE-NOTES-3.0.0.md','utf8');fs.writeFileSync('build/rel3.json',JSON.stringify({tag_name:'v3.0.0',name:'Goldwater cuckold 3.0.0',draft:true,prerelease:false,body}))"
  RID=$(curl -s -X POST "${auth[@]}" -H 'Content-Type: application/json' -d @build/rel3.json "$API/releases" | grep -m1 '"id":' | tr -dc '0-9')
fi
echo "release id: $RID"
[ -z "$RID" ] && { echo "no release id"; exit 1; }

upload() {
  local f="$1" name size
  name=$(basename "$f")
  size=$(stat -c %s "$f")
  local have
  have=$(curl -s "${auth[@]}" "$API/releases/$RID/assets" | tr '}' '\n' | grep "\"name\": \"$name\"" | grep -o '"size": *[0-9]*' | tr -dc '0-9')
  if [ "$have" = "$size" ]; then echo "skip $name ($size bytes already uploaded)"; return 0; fi
  echo "upload $name ($size bytes)"
  curl -sS --fail -X POST "${auth[@]}" \
    -H 'Content-Type: application/octet-stream' \
    --data-binary @"$f" \
    "https://uploads.github.com/repos/$OWNER/$REPO/releases/$RID/assets?name=$name" \
    -o "build/up-$name.json" -w "  -> HTTP %{http_code}, %{speed_upload} B/s\n"
  grep -q '"state": *"uploaded"' "build/up-$name.json" && echo "  ok $name" || { echo "  FAILED $name"; head -c 300 "build/up-$name.json"; echo; }
}

echo "== upload"
upload "$DIST/world.json"
upload "$DIST/module.json"
upload "$DIST/fxmaster.json"
upload "$DIST/fxmaster-5.0.1.zip"
upload "$DIST/world.zip"
upload "dist/goldwater-assets.zip"

echo "== done"
curl -s "${auth[@]}" "$API/releases/$RID/assets" | grep -E '"name"|"size"|"state"'
