#!/usr/bin/env bash
# Download the Nigeria OpenStreetMap extract and preprocess it for OSRM
# (car profile, MLD). Run this on your own machine, never on the VPS: it needs
# several GB of RAM. Then ship infra/osrm/data/ to the VPS and start the
# `routing` Compose profile.
#
#   OSRM_EXTRACT_URL  optional, defaults to the Geofabrik Nigeria extract
set -euo pipefail

IMAGE=ghcr.io/project-osrm/osrm-backend:v6.0.0
URL="${OSRM_EXTRACT_URL:-https://download.geofabrik.de/africa/nigeria-latest.osm.pbf}"
DIR="$(cd "$(dirname "$0")" && pwd)/data"

mkdir -p "$DIR"
if [ ! -f "$DIR/nigeria-latest.osm.pbf" ]; then
  echo "Downloading $URL"
  curl -fL --retry 3 -o "$DIR/nigeria-latest.osm.pbf" "$URL"
fi

run() { docker run --rm -t -v "$DIR:/data" "$IMAGE" "$@"; }
run osrm-extract -p /opt/car.lua /data/nigeria-latest.osm.pbf
run osrm-partition /data/nigeria-latest.osrm
run osrm-customize /data/nigeria-latest.osrm

echo "Done. Start it with: docker compose -f infra/compose/compose.yaml --env-file infra/compose/.env --profile routing up -d osrm"
