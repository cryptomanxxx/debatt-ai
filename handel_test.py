"""
handel_test.py — daglig handel för AI-agenter + prisjustering.
Körs via GitHub Actions varje natt.
"""

import os, math, random, requests
from datetime import datetime

SB_URL = os.environ.get("SUPABASE_URL", "https://fmwxftnistkoqazfwnuj.supabase.co")
SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

HEADERS = {
    "apikey":        SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=minimal",
}
HEADERS_REPR = {**HEADERS, "Prefer": "return=representation"}

AGENTER = [
    "Nationalekonom", "Miljöaktivist", "Teknikoptimist", "Konservativ debattör",
    "Jurist", "Journalist", "Filosof", "Läkare", "Psykolog", "Historiker",
    "Sociolog", "Kryptoanalytiker",
]

# Preferred goods per agent (used when picking what to buy)
AGENT_PREFERENSER = {
    "Nationalekonom":       ["Järn", "Spannmål"],
    "Miljöaktivist":        ["Trä", "Spannmål"],
    "Teknikoptimist":       ["Järn", "Kryddor"],
    "Konservativ debattör": ["Spannmål", "Tyg"],
    "Jurist":               ["Tyg", "Kryddor"],
    "Journalist":           ["Kryddor", "Fisk"],
    "Filosof":              ["Tyg", "Kryddor"],
    "Läkare":               ["Fisk", "Spannmål"],
    "Psykolog":             ["Fisk", "Tyg"],
    "Historiker":           ["Järn", "Trä"],
    "Sociolog":             ["Spannmål", "Fisk"],
    "Kryptoanalytiker":     ["Järn", "Kryddor"],
}


def sbGet(table, params=""):
    r = requests.get(f"{SB_URL}/rest/v1/{table}?{params}", headers=HEADERS, timeout=10)
    return r.json() if r.ok else []


def sbPost(table, data):
    return requests.post(f"{SB_URL}/rest/v1/{table}", headers=HEADERS, json=data, timeout=10)


def sbPatch(table, params, data):
    return requests.patch(f"{SB_URL}/rest/v1/{table}?{params}", headers=HEADERS, json=data, timeout=10)


def resekostnad(a, b):
    dx, dy = a["svg_x"] - b["svg_x"], a["svg_y"] - b["svg_y"]
    return max(15, math.floor(math.sqrt(dx*dx + dy*dy) / 4))


def säkerställ_agent(smeknamn, städer):
    existing = sbGet("handel_spelare", f"smeknamn=eq.{requests.utils.quote(smeknamn)}&select=id")
    if existing:
        return
    stockholm = next((s for s in städer if s["namn"] == "Stockholm"), städer[0])
    sbPost("handel_spelare", {
        "smeknamn":    smeknamn,
        "mynt":        1000,
        "stad_id":     stockholm["id"],
        "last_mangd":  0,
        "spelare_typ": "agent",
    })
    print(f"  Skapade agent: {smeknamn}")


def bästa_handel(spelare, städer, varor, priser):
    """Hitta bästa köp-resa-sälj-möjlighet. Returnerar (köp_vara, till_stad, net_vinst)."""
    nuv_stad = next((s for s in städer if s["id"] == spelare["stad_id"]), None)
    if not nuv_stad:
        return None

    bäst = None
    for v in varor:
        kop_p = next((p["kop_pris"] for p in priser
                       if p["stad_id"] == nuv_stad["id"] and p["vara_id"] == v["id"]), None)
        if not kop_p:
            continue
        for dest in städer:
            if dest["id"] == nuv_stad["id"]:
                continue
            salj_p = next((p["salj_pris"] for p in priser
                            if p["stad_id"] == dest["id"] and p["vara_id"] == v["id"]), None)
            if not salj_p:
                continue
            tc = resekostnad(nuv_stad, dest)
            net = salj_p - kop_p - tc
            if net > 0 and (bäst is None or net > bäst[2]):
                bäst = (v, dest, net, kop_p, tc, nuv_stad)
    return bäst


def handla(spelare, städer, varor, priser, prefs):
    sn = spelare["smeknamn"]
    nuv_stad = next((s for s in städer if s["id"] == spelare["stad_id"]), None)
    if not nuv_stad:
        return

    # Steg 1: sälj om last
    if spelare["last_mangd"] > 0 and spelare["last_vara_id"]:
        vara_namn = next((v["namn"] for v in varor if v["id"] == spelare["last_vara_id"]), "?")
        salj_p = next((p["salj_pris"] for p in priser
                        if p["stad_id"] == spelare["stad_id"] and p["vara_id"] == spelare["last_vara_id"]), None)
        if salj_p:
            intäkt = salj_p * spelare["last_mangd"]
            sbPatch("handel_spelare", f"smeknamn=eq.{requests.utils.quote(sn)}",
                    {"mynt": spelare["mynt"] + intäkt, "last_vara_id": None, "last_mangd": 0,
                     "uppdaterad": datetime.utcnow().isoformat()})
            sbPost("handel_logg", {"spelare_id": spelare["id"], "typ": "salj",
                "beskrivning": f"Sålde {spelare['last_mangd']}× {vara_namn}", "mynt_delta": intäkt})
            spelare["mynt"] += intäkt
            spelare["last_mangd"] = 0
            spelare["last_vara_id"] = None
            print(f"  {sn}: säljer {spelare['last_mangd']} {vara_namn} → +{intäkt} 🪙")

    if spelare["mynt"] < 50:
        print(f"  {sn}: för lite mynt ({spelare['mynt']}) — hoppar")
        return

    # Steg 2: hitta bästa affär
    handel = bästa_handel(spelare, städer, varor, priser)
    if not handel:
        print(f"  {sn}: ingen lönsam affär hittades")
        return

    v, dest, net, kop_p, tc, fran_stad = handel

    # Köp (max vad budget tillåter, max 80 enheter)
    max_råd = spelare["mynt"] - tc  # behåll pengar för resan
    if max_råd <= 0:
        print(f"  {sn}: råd inte med resa till {dest['namn']} ({tc} 🪙)")
        return
    mangd = min(80, max_råd // kop_p)
    if mangd < 1:
        print(f"  {sn}: råd inte köpa något")
        return

    totalt_kop = kop_p * mangd
    sbPatch("handel_spelare", f"smeknamn=eq.{requests.utils.quote(sn)}",
            {"mynt": spelare["mynt"] - totalt_kop, "last_vara_id": v["id"], "last_mangd": mangd,
             "uppdaterad": datetime.utcnow().isoformat()})
    sbPost("handel_logg", {"spelare_id": spelare["id"], "typ": "kop",
        "beskrivning": f"Köpte {mangd}× {v['namn']} à {kop_p} 🪙", "mynt_delta": -totalt_kop})
    spelare["mynt"] -= totalt_kop
    print(f"  {sn}: köper {mangd}× {v['namn']} à {kop_p} 🪙 i {fran_stad['namn']}")

    # Steg 3: resa
    if spelare["mynt"] < tc:
        print(f"  {sn}: råd inte resa till {dest['namn']} — stannar")
        return
    sbPatch("handel_spelare", f"smeknamn=eq.{requests.utils.quote(sn)}",
            {"stad_id": dest["id"], "mynt": spelare["mynt"] - tc,
             "uppdaterad": datetime.utcnow().isoformat()})
    sbPost("handel_logg", {"spelare_id": spelare["id"], "typ": "resa",
        "beskrivning": f"Reste från {fran_stad['namn']} till {dest['namn']}", "mynt_delta": -tc})
    spelare["mynt"] -= tc
    spelare["stad_id"] = dest["id"]
    print(f"  {sn}: reser till {dest['namn']} (kostnad {tc} 🪙, net/st {net} 🪙)")


def uppdatera_priser(priser):
    """Daglig prisjustering: ±10% slumpmässig fluktuation."""
    print("\nUppdaterar marknadspriser…")
    for p in priser:
        faktor_k = 0.92 + random.random() * 0.16   # 0.92–1.08
        faktor_s = 0.92 + random.random() * 0.16
        ny_kop  = max(5, round(p["kop_pris"]  * faktor_k))
        ny_salj = max(ny_kop + 2, round(p["salj_pris"] * faktor_s))
        if ny_kop != p["kop_pris"] or ny_salj != p["salj_pris"]:
            sbPatch("handel_priser", f"id=eq.{p['id']}",
                    {"kop_pris": ny_kop, "salj_pris": ny_salj,
                     "uppdaterad": datetime.utcnow().isoformat()})
    print("  Priser uppdaterade.")


def main():
    städer = sbGet("handel_städer", "order=id.asc")
    varor  = sbGet("handel_varor",  "order=id.asc")
    priser = sbGet("handel_priser", "select=*")
    if not städer or not varor or not priser:
        print("Saknar data — kör supabase_handel.sql och försök igen.")
        return

    print(f"Städer: {len(städer)}, Varor: {len(varor)}, Prisrader: {len(priser)}")

    # Säkerställ att alla agenter finns
    for a in AGENTER:
        säkerställ_agent(a, städer)

    # Hämta agenternas spelare-rader
    namn_param = ",".join(requests.utils.quote(a) for a in AGENTER)
    alla_spelare = sbGet("handel_spelare",
        f"smeknamn=in.({namn_param})&select=*&spelare_typ=eq.agent")

    print(f"\nHandlar med {len(alla_spelare)} agenter:")
    random.shuffle(alla_spelare)
    for sp in alla_spelare:
        prefs = AGENT_PREFERENSER.get(sp["smeknamn"], [])
        handla(sp, städer, varor, priser, prefs)

    # Prisjustering
    uppdatera_priser(priser)
    print("\nKlar.")


if __name__ == "__main__":
    main()
