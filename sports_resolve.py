"""
sports_resolve.py
Avgör öppna prediction markets för sport:
  - F1-race (api.jolpi.ca/ergast, ingen API-nyckel)
  - Fotboll (football-data.org, kräver FOOTBALL_DATA_API_KEY)

Körs via GitHub Actions (sports-resolve.yml) dagligen.
"""

import os, sys, json, requests
from datetime import datetime, timezone

SB_URL = os.getenv("SUPABASE_URL", "https://fmwxftnistkoqazfwnuj.supabase.co")
SB_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
FD_KEY = os.getenv("FOOTBALL_DATA_API_KEY")

SB_HEADERS = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

ERGAST = "https://api.jolpi.ca/ergast/f1"


def sb_get(path):
    r = requests.get(f"{SB_URL}/rest/v1/{path}", headers=SB_HEADERS, timeout=15)
    return r.json() if r.ok else []


def sb_patch(path, body):
    r = requests.patch(
        f"{SB_URL}/rest/v1/{path}",
        headers={**SB_HEADERS, "Prefer": "return=minimal"},
        json=body,
        timeout=15,
    )
    if not r.ok:
        print(f"    Supabase PATCH-fel {r.status_code}: {r.text[:200]}")
    return r.ok


def fetch_expired_sport_markets():
    nu = datetime.now(timezone.utc).isoformat()
    rows = sb_get(
        f"markets?status=eq.öppen&kategori=eq.sport"
        f"&deadline=lt.{requests.utils.quote(nu)}&select=id,titel,resolution_kalla"
    )
    result = []
    for row in rows:
        rk = row.get("resolution_kalla", "")
        if not rk:
            continue
        try:
            meta = json.loads(rk)
        except (json.JSONDecodeError, TypeError):
            continue
        if meta.get("type") in ("f1_win", "football_win"):
            result.append({"id": row["id"], "titel": row["titel"], "meta": meta})
    return result


def resolve_market(market_id, utfall):
    """utfall: 'ja' eller 'nej'"""
    ok = sb_patch(
        f"markets?id=eq.{market_id}",
        {"utfall": utfall, "status": "avgjord"},
    )
    return ok


# ── F1 ────────────────────────────────────────────────────────────────────────

def fetch_f1_winner(season, rnd):
    url = f"{ERGAST}/{season}/{rnd}/results.json"
    r = requests.get(url, timeout=15)
    if not r.ok:
        print(f"  Ergast resultat-fel {r.status_code} ({season} rnd {rnd})")
        return None
    races = r.json()["MRData"]["RaceTable"]["Races"]
    if not races:
        return None
    results = races[0].get("Results", [])
    if not results:
        return None
    winner = results[0]["Driver"]["driverId"]
    return winner


def resolve_f1(market):
    meta = market["meta"]
    season = meta.get("season")
    rnd = meta.get("round")
    driver_id = meta.get("driver_id")
    if not all([season, rnd, driver_id]):
        print(f"  Ofullständig F1-meta: {meta}")
        return False
    winner = fetch_f1_winner(season, rnd)
    if winner is None:
        print(f"  F1 resultat ej tillgängligt ännu ({season} rnd {rnd})")
        return False
    utfall = "ja" if winner == driver_id else "nej"
    ok = resolve_market(market["id"], utfall)
    print(f"  {'✅' if ok else '❌'} {market['titel']} → {utfall} (vinnare: {winner})")
    return ok


# ── Fotboll ───────────────────────────────────────────────────────────────────

def fetch_football_match(match_id):
    if not FD_KEY:
        return None
    url = f"https://api.football-data.org/v4/matches/{match_id}"
    r = requests.get(url, headers={"X-Auth-Token": FD_KEY}, timeout=15)
    if not r.ok:
        print(f"  football-data.org match {match_id}: {r.status_code}")
        return None
    return r.json()


def resolve_football(market):
    meta = market["meta"]
    match_id = meta.get("match_id")
    team_id = meta.get("team_id")
    side = meta.get("side", "home")
    if not all([match_id, team_id]):
        print(f"  Ofullständig fotbollsmeta: {meta}")
        return False

    data = fetch_football_match(match_id)
    if data is None:
        return False

    status = data.get("status", "")
    if status not in ("FINISHED", "AWARDED"):
        print(f"  Match {match_id} ej avgjord ännu (status: {status})")
        return False

    score = data.get("score", {})
    winner_val = score.get("winner")  # HOME_TEAM / AWAY_TEAM / DRAW

    if side == "home":
        utfall = "ja" if winner_val == "HOME_TEAM" else "nej"
    else:
        utfall = "ja" if winner_val == "AWAY_TEAM" else "nej"

    ok = resolve_market(market["id"], utfall)
    print(f"  {'✅' if ok else '❌'} {market['titel']} → {utfall} (winner_val: {winner_val})")
    return ok


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not SB_KEY:
        print("SUPABASE_SERVICE_ROLE_KEY saknas")
        sys.exit(1)

    markets = fetch_expired_sport_markets()
    print(f"\nHittade {len(markets)} utgångna sport-markets att avgöra")

    resolved = 0
    skipped = 0
    for m in markets:
        t = m["meta"].get("type")
        if t == "f1_win":
            if resolve_f1(m):
                resolved += 1
            else:
                skipped += 1
        elif t == "football_win":
            if resolve_football(m):
                resolved += 1
            else:
                skipped += 1

    print(f"\nAvgjorda: {resolved}  |  Ej klara/fel: {skipped}")
    print("Klar.")
