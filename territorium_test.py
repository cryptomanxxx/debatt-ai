"""
territorium_test.py — dagliga drag för AI-agenter i Territorium-spelet.
Körs via GitHub Actions varje natt (00:00 svensk tid).
"""

import os
import random
from datetime import date, timedelta
import requests

SB_URL = os.environ.get("SUPABASE_URL", "https://fmwxftnistkoqazfwnuj.supabase.co")
SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

HEADERS = {
    "apikey":        SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=minimal",
}

AGENTER = [
    "Nationalekonom", "Miljöaktivist", "Teknikoptimist", "Konservativ debattör",
    "Jurist", "Journalist", "Filosof", "Läkare", "Psykolog", "Historiker",
    "Sociolog", "Kryptoanalytiker",
]

AGENT_PREFERENSER = {
    "Nationalekonom":       ["stad", "industri"],
    "Miljöaktivist":        ["skog", "jordbruk", "energi"],
    "Teknikoptimist":       ["industri", "energi", "stad"],
    "Konservativ debattör": ["stad", "jordbruk"],
    "Jurist":               ["stad"],
    "Journalist":           ["stad", "kust"],
    "Filosof":              ["skog", "stad"],
    "Läkare":               ["jordbruk", "stad"],
    "Psykolog":             ["stad", "kust"],
    "Historiker":           ["skog", "stad", "gruva"],
    "Sociolog":             ["stad", "jordbruk"],
    "Kryptoanalytiker":     ["industri", "gruva", "energi"],
}

AGENT_AGGRESSION = {
    "Nationalekonom":       0.25,
    "Miljöaktivist":        0.05,
    "Teknikoptimist":       0.35,
    "Konservativ debattör": 0.45,
    "Jurist":               0.20,
    "Journalist":           0.30,
    "Filosof":              0.10,
    "Läkare":               0.15,
    "Psykolog":             0.15,
    "Historiker":           0.30,
    "Sociolog":             0.20,
    "Kryptoanalytiker":     0.55,
}


def sb_get(table, params=""):
    r = requests.get(f"{SB_URL}/rest/v1/{table}?{params}", headers=HEADERS, timeout=10)
    return r.json() if r.ok else []


def sb_post(table, data):
    return requests.post(f"{SB_URL}/rest/v1/{table}", headers=HEADERS, json=data, timeout=10)


def sb_patch(table, params, data):
    return requests.patch(f"{SB_URL}/rest/v1/{table}?{params}", headers=HEADERS, json=data, timeout=10)


def is_adjacent(col1, row1, col2, row2):
    dc = col2 - col1
    dr = row2 - row1
    if dr == 0:
        return abs(dc) == 1
    if abs(dr) == 1:
        if row1 % 2 == 0:   # jämn rad
            return dc == 0 or dc == -1
        else:                # udda rad
            return dc == 0 or dc == 1
    return False


def seed_hexagoner(event_id):
    hexes = [
        (0, 0, "Nordskogen",      "skog",     1),
        (1, 0, "Gruvberget",      "gruva",    2),
        (2, 0, "Arktiskusten",    "kust",     1),
        (3, 0, "Fjällregionen",   "skog",     1),
        (4, 0, "Ödemarkerna",     "skog",     1),
        (0, 1, "Industrihamnen",  "industri", 2),
        (1, 1, "Teknikstaden",    "stad",     3),
        (2, 1, "Centralplatsen",  "stad",     3),
        (3, 1, "Akademistaden",   "stad",     3),
        (4, 1, "Östkusten",       "kust",     1),
        (0, 2, "Jordbruksdalen",  "jordbruk", 1),
        (1, 2, "Handelsvägen",    "industri", 2),
        (2, 2, "Storstaden",      "stad",     3),
        (3, 2, "Kulturkvarteret", "stad",     2),
        (4, 2, "Fiskehamnen",     "kust",     1),
        (0, 3, "Solenergiparken", "energi",   2),
        (1, 3, "Organisk Gård",   "jordbruk", 1),
        (2, 3, "Södra Hamnen",    "industri", 2),
        (3, 3, "Gruvindustrin",   "gruva",    2),
        (4, 3, "Sydkusten",       "kust",     1),
    ]
    data = [{"event_id": event_id, "hex_col": c, "hex_row": r,
             "namn": n, "typ": t, "poang": p} for c, r, n, t, p in hexes]
    requests.post(f"{SB_URL}/rest/v1/territorium_hexagoner",
                  headers=HEADERS, json=data, timeout=10)
    print(f"  Seedade {len(hexes)} hexagoner för event {event_id}")


def avsluta_event(event):
    agare_list = sb_get("territorium_agare", f"event_id=eq.{event['id']}")
    if agare_list:
        from collections import Counter
        c = Counter(a["agare"] for a in agare_list)
        vinnare = c.most_common(1)[0][0]
    else:
        vinnare = "Ingen"
    sb_patch("territorium_events", f"id=eq.{event['id']}", {"status": "avslutad", "vinnare": vinnare})
    print(f"Event '{event['namn']}' avslutat. Vinnare: {vinnare}")
    return vinnare


def skapa_nytt_event():
    today = date.today()
    r = requests.post(
        f"{SB_URL}/rest/v1/territorium_events",
        headers={**HEADERS, "Prefer": "return=representation"},
        json={
            "namn":        "Territorium",
            "start_datum": today.isoformat(),
            "slut_datum":  (today + timedelta(days=14)).isoformat(),
        },
        timeout=10,
    )
    if r.ok and r.json():
        new_event = r.json()[0]
        seed_hexagoner(new_event["id"])
        print(f"Nytt event skapat (ID: {new_event['id']}, slutar {new_event['slut_datum']})")
        return new_event
    return None


def gor_drag(event_id, agent, hexagoner, agare_list):
    today = date.today().isoformat()
    todays_drag = sb_get(
        "territorium_drag",
        f"event_id=eq.{event_id}&agare=eq.{requests.utils.quote(agent)}&skapad=gte.{today}T00:00:00",
    )
    if todays_drag:
        print(f"  {agent}: redan gjort drag idag")
        return

    hex_by_id  = {h["id"]: h for h in hexagoner}
    aga_by_hex = {a["hex_id"]: a for a in agare_list}
    mina       = [h for h in hexagoner if aga_by_hex.get(h["id"], {}).get("agare") == agent]
    prefs      = AGENT_PREFERENSER.get(agent, ["stad"])
    aggr       = AGENT_AGGRESSION.get(agent, 0.3)

    def log_drag(hex_id, drag_typ, resultat):
        sb_post("territorium_drag", {
            "event_id":  event_id,
            "agare":     agent,
            "agare_typ": "agent",
            "hex_id":    hex_id,
            "drag_typ":  drag_typ,
            "resultat":  resultat,
        })

    # Första drag: ta valfri ledig hex
    if not mina:
        lediga = [h for h in hexagoner if h["id"] not in aga_by_hex]
        if not lediga:
            print(f"  {agent}: inga lediga hexes kvar")
            return
        pref_lediga = [h for h in lediga if h["typ"] in prefs]
        val = random.choice(pref_lediga if pref_lediga else lediga)
        sb_post("territorium_agare", {
            "event_id":  event_id,
            "hex_id":    val["id"],
            "agare":     agent,
            "agare_typ": "agent",
            "forsvar":   1,
        })
        log_drag(val["id"], "expandera", "lyckades")
        print(f"  {agent}: startdrag → {val['namn']}")
        return

    # Angränsande hexes (inte egna)
    angr = []
    for h in mina:
        for nb in hexagoner:
            if nb["id"] != h["id"] and nb["id"] not in [x["id"] for x in angr]:
                if is_adjacent(h["hex_col"], h["hex_row"], nb["hex_col"], nb["hex_row"]):
                    if aga_by_hex.get(nb["id"], {}).get("agare") != agent:
                        angr.append(nb)

    fiendliga   = [h for h in angr if h["id"] in aga_by_hex]
    lediga_nara = [h for h in angr if h["id"] not in aga_by_hex]

    # 15% chans att försvara svagaste egna hex
    if random.random() < 0.15:
        svag = min(mina, key=lambda h: aga_by_hex.get(h["id"], {}).get("forsvar", 1))
        nuv_forsvar = aga_by_hex.get(svag["id"], {}).get("forsvar", 1)
        if nuv_forsvar < 3:
            sb_patch("territorium_agare",
                     f"event_id=eq.{event_id}&hex_id=eq.{svag['id']}",
                     {"forsvar": nuv_forsvar + 1})
            log_drag(svag["id"], "forsvara", "lyckades")
            print(f"  {agent}: förstärker {svag['namn']} (försvar {nuv_forsvar}→{nuv_forsvar+1})")
            return

    # Attackera baserat på aggression
    if fiendliga and random.random() < aggr:
        mål = random.choice(fiendliga)
        forsvar = aga_by_hex.get(mål["id"], {}).get("forsvar", 1)
        adj_count = sum(
            1 for h in mina
            if is_adjacent(h["hex_col"], h["hex_row"], mål["hex_col"], mål["hex_row"])
        )
        lyckades = adj_count > forsvar
        if lyckades:
            sb_patch("territorium_agare",
                     f"event_id=eq.{event_id}&hex_id=eq.{mål['id']}",
                     {"agare": agent, "agare_typ": "agent", "forsvar": 1})
        log_drag(mål["id"], "attackera", "lyckades" if lyckades else "misslyckades")
        sym = "✓" if lyckades else "✗"
        print(f"  {agent}: attackerar {mål['namn']} ({adj_count}vs{forsvar}) {sym}")
        return

    # Expandera till ledig angränsande hex
    if lediga_nara:
        pref_lediga = [h for h in lediga_nara if h["typ"] in prefs]
        val = random.choice(pref_lediga if pref_lediga else lediga_nara)
        sb_post("territorium_agare", {
            "event_id":  event_id,
            "hex_id":    val["id"],
            "agare":     agent,
            "agare_typ": "agent",
            "forsvar":   1,
        })
        log_drag(val["id"], "expandera", "lyckades")
        print(f"  {agent}: expanderar → {val['namn']}")
        return

    print(f"  {agent}: inget möjligt drag")


def main():
    events = sb_get("territorium_events", "status=eq.aktiv&order=skapad.desc&limit=1")

    # Inget aktivt event → skapa ett
    if not events:
        print("Inget aktivt event — skapar nytt.")
        skapa_nytt_event()
        return

    event = events[0]
    today = date.today()
    slut  = date.fromisoformat(event["slut_datum"])

    # Event har löpt ut → avsluta och starta nytt
    if today > slut:
        avsluta_event(event)
        skapa_nytt_event()
        return

    print(f"Event: {event['namn']} ({event['start_datum']} → {event['slut_datum']})")
    dagar_kvar = (slut - today).days
    print(f"Dagar kvar: {dagar_kvar}")

    hexagoner = sb_get("territorium_hexagoner", f"event_id=eq.{event['id']}")
    if not hexagoner:
        print("Inga hexagoner hittades — seedar.")
        seed_hexagoner(event["id"])
        hexagoner = sb_get("territorium_hexagoner", f"event_id=eq.{event['id']}")

    agare_list = sb_get("territorium_agare", f"event_id=eq.{event['id']}")
    print(f"Hexagoner: {len(hexagoner)}, ägda: {len(agare_list)}")

    random.shuffle(AGENTER)
    for agent in AGENTER:
        gor_drag(event["id"], agent, hexagoner, agare_list)
        agare_list = sb_get("territorium_agare", f"event_id=eq.{event['id']}")


if __name__ == "__main__":
    main()
