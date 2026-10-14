# OSRM routing

Self hosted OSRM (car profile, MLD, Nigeria extract) for routes, ETAs, and Collabo
overlap (spec 0009). It is internal only.

1. On your own machine (not the VPS), run `bash infra/osrm/preprocess.sh`.
   It downloads the extract and writes the processed files to `infra/osrm/data/` (gitignored).
2. Start it: `docker compose -f infra/compose/compose.yaml --env-file infra/compose/.env --profile routing up -d osrm`
3. Check it: `curl "http://localhost:5000/route/v1/driving/3.3792,6.5244;3.4219,6.4281?overview=false"`

OSRM sits in its own `routing` profile instead of `infra`, because it cannot start
until step 1 has run. Nothing calls it until the Collabo slices.
