#!/usr/bin/env bash
# Extract one PMTiles file per inhabited island from the latest Protomaps build.
# Starts at max zoom 14 and lowers it until each file is under 90 MB (GitHub limit is 100 MB).
set -euo pipefail
cd "$(dirname "$0")/.."
command -v pmtiles >/dev/null || { echo "pmtiles CLI not found. brew install pmtiles"; exit 1; }
mkdir -p app/public/tiles
# Daily builds are named by date. Probe the last 10 days for the newest one that exists.
BUILD=""
for i in $(seq 0 9); do
  d=$(date -u -v-${i}d +%Y%m%d 2>/dev/null || date -u -d "-${i} days" +%Y%m%d)
  if curl -sfI "https://build.protomaps.com/$d.pmtiles" >/dev/null; then BUILD="$d.pmtiles"; break; fi
done
[ -n "$BUILD" ] || { echo "No Protomaps daily build found in the last 10 days"; exit 1; }
SRC="https://build.protomaps.com/$BUILD"
echo "Source: $SRC"
MAX_BYTES=$((90*1024*1024))
node -e '
const y=require("js-yaml"),fs=require("fs");
for(const i of y.load(fs.readFileSync("data/islands.yaml","utf8"))) if(!["niihau","kahoolawe"].includes(i.id)) console.log(i.id, i.bounds.join(","));
' | while read -r id bbox; do
  z=14
  while true; do
    out="app/public/tiles/$id.pmtiles"
    pmtiles extract "$SRC" "$out" --bbox="$bbox" --maxzoom="$z"
    size=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out")
    echo "$id z$z: $((size/1024/1024)) MB"
    [ "$size" -le "$MAX_BYTES" ] && break
    z=$((z-1))
  done
done
echo "$BUILD" > app/public/tiles/BUILD.txt
