"""
sports_markets.py
Skapar prediction markets för kommande sportevenemang:
  - F1-race (api.jolpi.ca/ergast, ingen API-nyckel)
  - Fotboll (football-data.org, kräver FOOTBALL_DATA_API_KEY)

Körs via GitHub Actions (sports-markets.yml) måndag + fredag.
"""

import os, sys, json, requests
from datetime import datetime, timezone, timedelta

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

FOOTBALL_LEAGUES = {
    "PL":  "Premier League",
    "PD":  "La Liga",
    "BL1": "Bundesliga",
    "SA":  "Serie A",
    "CL":  "Champions League",
}


def sb_get(path):
    r = requests.get(f"{SB_URL}/rest/v1/{path}", headers=SB_HEADERS, timeout=15)
    return r.json() if r.ok else []


def sb_post(path, body):
    r = requests.post(f"{SB_URL}/rest/v1/{path}", headers=SB_HEADERS, json=body, timeout=15)
    if not r.ok:
        print(f"    Supabase INSERT-fel {r.status_code}: {r.text[:200]}")
    return r.ok


def market_exists(resolution_key):
    rows = sb_get(
        f"markets?resolution_kalla=eq.{requests.utils.quote(resolution_key)}&select=id"
    )
    return bool(rows)


def create_market(titel, beskrivning, deadline_iso, resolution_key, kategori="sport"):
    if market_exists(resolution_key):
        print(f"    Finns redan: {titel}")
        return False
    ok = sb_post("markets", {
        "titel": titel,
        "beskrivning": beskrivning,
        "deadline": deadline_iso,
        "resolution_kalla": resolution_key,
        "status": "öppen",
        "kategori": kategori,
        "utfall": None,
    })
    print(f"    {'✅' if ok else '❌'} {titel}")
    return ok


# ── F1 ────────────────────────────────────────────────────────────────────────

def fetch_f1_schedule():
    r = requests.get(f"{ERGAST}/current.json", timeout=15)
    if not r.ok:
        print(f"  Ergast schema-fel: {r.status_code}")
        return []
    return r.json()["MRData"]["RaceTable"]["Races"]


def fetch_f1_leader():
    r = requests.get(f"{ERGAST}/current/driverStandings.json", timeout=15)
    if not r.ok:
        return "Max Verstappen", "verstappen"
    lists = r.json()["MRData"]["StandingsTable"]["StandingsLists"]
    if not lists:
        return "Max Verstappen", "verstappen"
    leader = lists[0]["DriverStandings"][0]["Driver"]
    name = f"{leader['givenName']} {leader['familyName']}"
    return name, leader["driverId"]


def create_f1_markets():
    print("\n── F1-markets ──")
    races = fetch_f1_schedule()
    if not races:
        return
    leader_name, leader_id = fetch_f1_leader()
    print(f"  VM-ledare: {leader_name} ({leader_id})")
    nu = datetime.now(timezone.utc)
    created = 0
    for race in races:
        race_date = datetime.fromisoformat(race["date"] + "T00:00:00+00:00")
        days_away = (race_date - nu).days
        if days_away < 0 or days_away > 21:
            continue
        gp_name = race["raceName"]
        season  = race["season"]
        rnd     = race["round"]
        key = json.dumps(
            {"type": "f1_win", "season": season, "round": rnd, "driver_id": leader_id},
            separators=(",", ":"), ensure_ascii=False
        )
        titel = f"Vinner {leader_name} {gp_name} {season}?"
        besk  = (
            f"{leader_name} leder F1-VM {season}. Vinner hen {gp_name}? "
            f"Avgörs efter loppet {race['date']}."
        )
        if create_market(titel, besk, race["date"] + "T23:59:00Z", key):
            created += 1
    print(f"  F1: {created} nya markets skapade")


# ── Fotboll ───────────────────────────────────────────────────────────────────

def fetch_upcoming_matches(code):
    nu      = datetime.now(timezone.utc)
    d_from  = nu.strftime("%Y-%m-%d")
    d_to    = (nu + timedelta(days=10)).strftime("%Y-%m-%d")
    url     = (
        f"https://api.football-data.org/v4/competitions/{code}/matches"
        f"?status=SCHEDULED&dateFrom={d_from}&dateTo={d_to}"
    )
    r = requests.get(url, headers={"X-Auth-Token": FD_KEY}, timeout=15)
    if not r.ok:
        print(f"  football-data.org {code}: {r.status_code} {r.text[:120]}")
        return []
    return r.json().get("matches", [])


def create_football_markets():
    if not FD_KEY:
        print("\n── Fotboll: FOOTBALL_DATA_API_KEY saknas — hoppar över ──")
        return
    print("\n── Fotboll-markets ──")
    total = 0
    for code, league_name in FOOTBALL_LEAGUES.items():
        try:
            matches = fetch_upcoming_matches(code)
        except Exception as e:
            print(f"  {code}: fel — {e}")
            continue
        for match in matches[:2]:  # max 2 matcher per liga
            match_id  = match["id"]
            home_name = match["homeTeam"]["name"]
            away_name = match["awayTeam"]["name"]
            home_id   = match["homeTeam"]["id"]
            match_date = match["utcDate"][:10]
            key = json.dumps(
                {"type": "football_win", "match_id": match_id, "team_id": home_id, "side": "home"},
                separators=(",", ":"), ensure_ascii=False
            )
            titel = f"Vinner {home_name} mot {away_name} ({league_name})?"
            besk  = (
                f"{league_name}-match den {match_date}. "
                f"Vinner hemmalaget {home_name}? Avgörs efter matchens slut."
            )
            if create_market(titel, besk, match_date + "T23:59:00Z", key):
                total += 1
    print(f"  Fotboll: {total} nya markets skapade")


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not SB_KEY:
        print("SUPABASE_SERVICE_ROLE_KEY saknas")
        sys.exit(1)
    create_f1_markets()
    create_football_markets()
    print("\nKlar.")
