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
# ett Vercel-team snarare än ett personligt scope) + valfri VERCEL_PROJECT_ID
# (secret — projektets id, t.ex. "prj_..." från Vercels Project Settings →
# General. Satt hoppar skriptet över namn-uppslaget mot Vercels API och
# använder id:t direkt; osatt faller det tillbaka på att slå upp id:t från
# VERCEL_PROJECT_NAME, som förut).
#
# Vercel avvisar redan (409/403) ett raderingsförsök mot en deployment som
# har en aktiv domän-alias — dvs. den nuvarande produktionsdeploymenten kan
# i praktiken inte raderas av misstag av det här skriptet ens om den råkar
# hamna utanför KEEP_LATEST-golvet. Ett sådant fel loggas och skriptet
# fortsätter med nästa deployment istället för att avbryta hela körningen.

set -uo pipefail

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

: "${VERCEL_TOKEN:?VERCEL_TOKEN måste vara satt}"
PROJECT_NAME="${VERCEL_PROJECT_NAME:-debatt-ai}"
PROJECT_ID_OVERRIDE="${VERCEL_PROJECT_ID:-}"
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

if [[ -n "$PROJECT_ID_OVERRIDE" ]]; then
  # VERCEL_PROJECT_ID satt — använd den direkt, hoppa över namn-uppslaget.
  PROJECT_ID="$PROJECT_ID_OVERRIDE"
  echo "Projekt-id (från VERCEL_PROJECT_ID): ${PROJECT_ID}"
else
  PROJECT_URL="https://api.vercel.com/v9/projects/${PROJECT_NAME}$( [[ -n "$TEAM_QS" ]] && echo "?${TEAM_QS}" )"
  PROJECT_JSON=$(api "$PROJECT_URL")
  PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.id // empty')

  if [[ -z "$PROJECT_ID" ]]; then
    echo "Kunde inte slå upp projekt '${PROJECT_NAME}'. Svar från Vercel:"
    echo "$PROJECT_JSON"
    exit 1
  fi
  echo "Projekt-id: ${PROJECT_ID}"
fi

CUTOFF_MS=$(( $(date -u +%s) * 1000 - RETENTION_DAYS * 86400 * 1000 ))

echo "Hämtar deployments..."
# Ackumuleras via filer, inte som en shell-variabel skickad genom --argjson —
# jq körs som en extern process (execve), och Linux begränsar en ENSKILD
# argv-sträng till ~128 KB (MAX_ARG_STRLEN). Vercels deployment-objekt är
# ordrika (aliaser, builds, git-metadata) — redan 100 st i en sida kan
# överstiga den gränsen och ge "Argument list too long", vilket tidigare
# tystade bort hela sidans innehåll (ALL_DEPLOYMENTS blev tom sträng) och
# gjorde att skriptet felaktigt rapporterade "Inget att radera" istället för
# att faktiskt misslyckas synligt. Filargument till jq är bara korta
# sökvägar — själva JSON-innehållet läses via fil-I/O, aldrig via argv, så
# gränsen kan aldrig träffas oavsett hur många deployments som ackumuleras.
ALL_FILE="${TMP_DIR}/all.json"
echo "[]" > "$ALL_FILE"
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

  PAGE_FILE="${TMP_DIR}/page_${PAGE_NUM}.json"
  printf '%s' "$DEPLOYMENTS" > "$PAGE_FILE"
  jq -s 'add' "$ALL_FILE" "$PAGE_FILE" > "${ALL_FILE}.new"
  mv "${ALL_FILE}.new" "$ALL_FILE"

  UNTIL=$(echo "$PAGE" | jq -r '.pagination.next // empty')
  if [[ -z "$UNTIL" || "$UNTIL" == "null" ]]; then
    break
  fi
done

TOTAL=$(jq 'length' "$ALL_FILE")
echo "Totalt hämtade deployments: ${TOTAL}"

TO_DELETE_FILE="${TMP_DIR}/to_delete.json"
jq -c --argjson keep "$KEEP_LATEST" --argjson cutoff "$CUTOFF_MS" '
  sort_by(-.createdAt)
  | .[$keep:]
  | map(select(.createdAt < $cutoff))
' "$ALL_FILE" > "$TO_DELETE_FILE"

DELETE_COUNT=$(jq 'length' "$TO_DELETE_FILE")
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
done < <(jq -c '.[]' "$TO_DELETE_FILE")

echo "Klart. Raderade: ${DELETED} | Misslyckade: ${FAILED} | (dry_run=${DRY_RUN})"
