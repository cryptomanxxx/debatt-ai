#!/usr/bin/env bash
# Raderar gamla Vercel-deployments för att hålla Deployment Storage under
# Hobby-planens 10 GB-tak (se CLAUDE.md ✅94/✅119). Vercel raderar aldrig
# gamla deployments automatiskt på Hobby — Deployment Storage är kumulativ
# lagring av ALLA sparade deployments, inte bara den senaste.
#
# Policy: rör aldrig de KEEP_LATEST senaste deployments oavsett ålder (en
# säkerhetsgolv mot att av misstag radera nyliga rollback-mål), radera
# annars allt äldre än RETENTION_DAYS dagar bland resten.
#
# Körs av .github/workflows/vercel-deployment-prune.yml. Kräver VERCEL_TOKEN
# (secret) + valfri VERCEL_TEAM_ID (secret, bara om projektet ligger under
# ett Vercel-team snarare än ett personligt scope).
#
# Vercel avvisar redan (409/403) ett raderingsförsök mot en deployment som
# har en aktiv domän-alias — dvs. den nuvarande produktionsdeploymenten kan
# i praktiken inte raderas av misstag av det här skriptet ens om den råkar
# hamna utanför KEEP_LATEST-golvet. Ett sådant fel loggas och skriptet
# fortsätter med nästa deployment istället för att avbryta hela körningen.

set -uo pipefail

: "${VERCEL_TOKEN:?VERCEL_TOKEN måste vara satt}"
PROJECT_NAME="${VERCEL_PROJECT_NAME:-debatt-ai}"
TEAM_ID="${VERCEL_TEAM_ID:-}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
KEEP_LATEST="${KEEP_LATEST:-20}"
DRY_RUN="${DRY_RUN:-true}"

TEAM_QS=""
if [[ -n "$TEAM_ID" ]]; then
  TEAM_QS="teamId=${TEAM_ID}"
fi

api() {
  curl -sS -H "Authorization: Bearer ${VERCEL_TOKEN}" "$@"
}

qs_join() {
  # Slår ihop redan satta query-parametrar med "&", hoppar över tomma.
  local out=""
  for part in "$@"; do
    [[ -z "$part" ]] && continue
    if [[ -z "$out" ]]; then out="$part"; else out="${out}&${part}"; fi
  done
  echo "$out"
}

echo "== Vercel deployment prune =="
echo "Projekt: ${PROJECT_NAME} | retention: ${RETENTION_DAYS}d | keep_latest: ${KEEP_LATEST} | dry_run: ${DRY_RUN}"

PROJECT_URL="https://api.vercel.com/v9/projects/${PROJECT_NAME}$( [[ -n "$TEAM_QS" ]] && echo "?${TEAM_QS}" )"
PROJECT_JSON=$(api "$PROJECT_URL")
PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.id // empty')

if [[ -z "$PROJECT_ID" ]]; then
  echo "Kunde inte slå upp projekt '${PROJECT_NAME}'. Svar från Vercel:"
  echo "$PROJECT_JSON"
  exit 1
fi
echo "Projekt-id: ${PROJECT_ID}"

CUTOFF_MS=$(( $(date -u +%s) * 1000 - RETENTION_DAYS * 86400 * 1000 ))

echo "Hämtar deployments..."
ALL_DEPLOYMENTS="[]"
UNTIL=""
PAGE_NUM=0
while true; do
  PAGE_NUM=$((PAGE_NUM + 1))
  QS=$(qs_join "projectId=${PROJECT_ID}" "limit=100" "$TEAM_QS" "${UNTIL:+until=${UNTIL}}")
  PAGE=$(api "https://api.vercel.com/v6/deployments?${QS}")

  DEPLOYMENTS=$(echo "$PAGE" | jq -c '.deployments // empty')
  if [[ -z "$DEPLOYMENTS" ]]; then
    echo "Oväntat svar från Vercel på sida ${PAGE_NUM}:"
    echo "$PAGE"
    exit 1
  fi

  COUNT=$(echo "$DEPLOYMENTS" | jq 'length')
  echo "Sida ${PAGE_NUM}: ${COUNT} deployments"
  if [[ "$COUNT" -eq 0 ]]; then
    break
  fi

  ALL_DEPLOYMENTS=$(jq -c -n --argjson a "$ALL_DEPLOYMENTS" --argjson b "$DEPLOYMENTS" '$a + $b')
  UNTIL=$(echo "$PAGE" | jq -r '.pagination.next // empty')
  if [[ -z "$UNTIL" || "$UNTIL" == "null" ]]; then
    break
  fi
done

TOTAL=$(echo "$ALL_DEPLOYMENTS" | jq 'length')
echo "Totalt hämtade deployments: ${TOTAL}"

TO_DELETE=$(echo "$ALL_DEPLOYMENTS" | jq -c --argjson keep "$KEEP_LATEST" --argjson cutoff "$CUTOFF_MS" '
  sort_by(-.createdAt)
  | .[$keep:]
  | map(select(.createdAt < $cutoff))
')

DELETE_COUNT=$(echo "$TO_DELETE" | jq 'length')
echo "Kandidater för radering (äldre än ${RETENTION_DAYS}d, bortom de ${KEEP_LATEST} senaste): ${DELETE_COUNT}"

if [[ "$DELETE_COUNT" -eq 0 ]]; then
  echo "Inget att radera."
  exit 0
fi

DELETED=0
FAILED=0
while IFS= read -r dep; do
  ID=$(echo "$dep" | jq -r '.uid // .id')
  URL_HOST=$(echo "$dep" | jq -r '.url // "okänd"')
  CREATED=$(echo "$dep" | jq -r '.createdAt')

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[dry-run] skulle radera ${ID} (${URL_HOST}, skapad ${CREATED})"
    continue
  fi

  DEL_QS=$(qs_join "$TEAM_QS")
  DEL_URL="https://api.vercel.com/v13/deployments/${ID}"
  [[ -n "$DEL_QS" ]] && DEL_URL="${DEL_URL}?${DEL_QS}"

  HTTP_CODE=$(curl -sS -o /tmp/vercel_delete_resp.json -w "%{http_code}" -X DELETE \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" "$DEL_URL")

  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "204" ]]; then
    echo "Raderad: ${ID} (${URL_HOST})"
    DELETED=$((DELETED + 1))
  else
    echo "Kunde INTE radera ${ID} (${URL_HOST}): HTTP ${HTTP_CODE} — $(cat /tmp/vercel_delete_resp.json 2>/dev/null)"
    FAILED=$((FAILED + 1))
  fi
done < <(echo "$TO_DELETE" | jq -c '.[]')

echo "Klart. Raderade: ${DELETED} | Misslyckade: ${FAILED} | (dry_run=${DRY_RUN})"
