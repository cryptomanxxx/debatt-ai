#!/usr/bin/env python3
"""
mark_andrahand_test.py — Andrahandsmarknaden för mark
Körs dagligen 10:00 svensk tid (08:00 UTC).
Agenter auktionerar ut zoner de äger. Bud och affärer hanteras automatiskt.
"""
import os, random, urllib.parse
from datetime import datetime, timezone, timedelta
import httpx

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ["SUPABASE_ANON_KEY"]

LIST_SANNOLIKHET = 0.05   # 5% chans per markägare per körning
BUD_SANNOLIKHET  = 0.10   # 10% chans per agent per körning
AUKTION_TIMMAR   = 48     # Auktionslängd
MIN_BUD_PAASLAG  = 0.10   # Minst 10% höjning per bud

OPPEN = urllib.parse.quote("öppen", safe="")

AGENTER = [
    "Nationalekonom", "Miljöaktivist", "Teknikoptimist", "Konservativ debattör",
    "Jurist", "Journalist", "Filosof", "Läkare", "Psykolog", "Historiker",
    "Sociolog", "Kryptoanalytiker", "Den hungriga", "Mamman", "Den sura",
    "Den trötta", "Den stressade", "Den lugna", "Pensionären", "Tonåringen",
    "Den nostalgiske", "Hypokondrikern", "Optimisten", "Den rike",
]


def _h():
    return {
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def sb_get(path):
    r = httpx.get(f"{SB_URL}/rest/v1/{path}", headers={**_h(), "Prefer": ""}, timeout=15)
    return r.json() if r.is_success else []


def sb_post(table, data):
    r = httpx.post(f"{SB_URL}/rest/v1/{table}", headers=_h(), json=data, timeout=15)
    return r.json()[0] if r.is_success and r.json() else None


def sb_patch(path, data):
    r = httpx.patch(f"{SB_URL}/rest/v1/{path}", headers=_h(), json=data, timeout=15)
    return r.is_success


def stang_auktioner():
    """Stänger utgångna auktioner och genomför affärer om bud finns."""
    print("\n── Stänger utgångna auktioner ──")
    now_q = urllib.parse.quote(datetime.now(timezone.utc).isoformat())
    utgangna = sb_get(
        f"mark_auktioner?select=*,mark_zoner(namn)"
        f"&status=eq.{OPPEN}&stanger_at=lt.{now_q}"
    )

    if not utgangna:
        print("  Inga utgångna auktioner.")
        return 0

    affarer = 0
    for aukt in utgangna:
        zon_namn = (aukt.get("mark_zoner") or {}).get("namn", f"zon {aukt['zon_id']}")

        if aukt.get("nuv_bud") and aukt.get("hogst_budgivare"):
            kop_agent  = aukt["hogst_budgivare"]
            salj_agent = aukt["saljare"]
            pris       = aukt["nuv_bud"]
            zon_id     = aukt["zon_id"]

            # Uppdatera ägare i mark_agare
            sb_patch(
                f"mark_agare?zon_id=eq.{zon_id}",
                {"agent": kop_agent, "kopt_pris": pris, "kopt_datum": "now()"},
            )

            # Debitera köparen
            kop_pb = sb_get(f"agent_planbocker?agent=eq.{urllib.parse.quote(kop_agent)}&select=saldo")
            kop_s  = float(kop_pb[0]["saldo"]) if kop_pb else 0
            sb_patch(
                f"agent_planbocker?agent=eq.{urllib.parse.quote(kop_agent)}",
                {"saldo": round(kop_s - pris, 2), "uppdaterad": "now()"},
            )

            # Kreditera säljaren
            sal_pb = sb_get(f"agent_planbocker?agent=eq.{urllib.parse.quote(salj_agent)}&select=saldo")
            sal_s  = float(sal_pb[0]["saldo"]) if sal_pb else 0
            sb_patch(
                f"agent_planbocker?agent=eq.{urllib.parse.quote(salj_agent)}",
                {"saldo": round(sal_s + pris, 2), "uppdaterad": "now()"},
            )

            # Transaktionslogg
            sb_post("mark_transaktioner", {
                "zon_id": zon_id, "zon_namn": zon_namn,
                "kop_agent": kop_agent, "salj_agent": salj_agent, "pris": pris,
            })

            sb_patch(f"mark_auktioner?id=eq.{aukt['id']}", {"status": "avgjord"})
            print(f"  ✓ {salj_agent} → {kop_agent}: '{zon_namn}' {pris} kr")
            affarer += 1
        else:
            sb_patch(f"mark_auktioner?id=eq.{aukt['id']}", {"status": "inställd"})
            print(f"  ○ '{zon_namn}' — inga bud, inställd")

    return affarer


def lista_zoner(agare_rows, oppna_zon_ids, zoner_map):
    """~5% chans per markägare att lista en zon för 48h-auktion."""
    print("\n── Agenter listar mark ──")
    listade = 0
    stanger = (datetime.now(timezone.utc) + timedelta(hours=AUKTION_TIMMAR)).isoformat()

    random.shuffle(agare_rows)
    for ag in agare_rows:
        if random.random() > LIST_SANNOLIKHET:
            continue

        zon_id = ag["zon_id"]
        if zon_id in oppna_zon_ids:
            continue  # Redan på auktion

        agent      = ag["agent"]
        kopt_pris  = ag.get("kopt_pris") or 400
        reservpris = round(kopt_pris * 0.75)
        zon_namn   = (zoner_map.get(zon_id) or {}).get("namn", f"zon {zon_id}")

        r = sb_post("mark_auktioner", {
            "zon_id": zon_id, "saljare": agent,
            "reservpris": reservpris, "stanger_at": stanger,
        })
        if r:
            oppna_zon_ids.add(zon_id)
            print(f"  ✓ {agent} listar '{zon_namn}' — reservpris {reservpris} kr (48h)")
            listade += 1

    if not listade:
        print("  Inga nya auktioner denna körning.")
    return listade


def lagg_bud(oppna_aukt, saldon):
    """~10% chans per agent att lägga bud på en öppen auktion."""
    print("\n── Agenter lägger bud ──")
    if not oppna_aukt:
        print("  Inga öppna auktioner.")
        return 0

    # Slå upp zonnamn för alla öppna auktioner
    zon_ids  = list({a["zon_id"] for a in oppna_aukt})
    zon_rows = sb_get(f"mark_zoner?id=in.({','.join(str(z) for z in zon_ids)})&select=id,namn")
    zon_namn_map = {r["id"]: r["namn"] for r in zon_rows}

    bud_lagda = 0
    random.shuffle(AGENTER)
    for agent in AGENTER:
        if random.random() > BUD_SANNOLIKHET:
            continue

        saldo = saldon.get(agent, 0)
        if saldo < 100:
            continue

        budget  = min(saldo * 0.4, 2000)
        mojliga = [
            a for a in oppna_aukt
            if a["saljare"] != agent
            and a.get("hogst_budgivare") != agent
        ]

        overkomliga = [
            a for a in mojliga
            if (a.get("nuv_bud") or a["reservpris"]) * (1 + MIN_BUD_PAASLAG) <= budget
        ]
        if not overkomliga:
            overkomliga = [a for a in mojliga if a["reservpris"] <= budget]
        if not overkomliga:
            continue

        aukt    = random.choice(overkomliga)
        nuv     = aukt.get("nuv_bud") or (aukt["reservpris"] - 1)
        min_bud = round(nuv * (1 + MIN_BUD_PAASLAG)) if aukt.get("nuv_bud") else aukt["reservpris"]
        if min_bud > budget:
            continue

        bud_belopp = min(round(min_bud * (1 + random.uniform(0, 0.12))), int(budget))

        sb_post("mark_bud", {"auktion_id": aukt["id"], "budgivare": agent, "belopp": bud_belopp})
        sb_patch(f"mark_auktioner?id=eq.{aukt['id']}",
                 {"nuv_bud": bud_belopp, "hogst_budgivare": agent})

        zon_namn = zon_namn_map.get(aukt["zon_id"], f"zon {aukt['zon_id']}")
        print(f"  ✓ {agent} bud {bud_belopp} kr på '{zon_namn}' (säljs av {aukt['saljare']})")
        bud_lagda += 1
        # Uppdatera lokalt för att undvika dubbelbud på samma auktion
        aukt["nuv_bud"]        = bud_belopp
        aukt["hogst_budgivare"] = agent

    if not bud_lagda:
        print("  Inga bud denna körning.")
    return bud_lagda


def main():
    print("=== MARK_ANDRAHAND: Daglig körning ===")

    affarer = stang_auktioner()

    agare_rows = sb_get("mark_agare?select=zon_id,agent,kopt_pris")
    planbocker  = sb_get("agent_planbocker?select=agent,saldo&agent=neq.Statskassa")
    oppna_aukt  = sb_get(f"mark_auktioner?select=*&status=eq.{OPPEN}")
    zoner_all   = sb_get("mark_zoner?select=id,namn")

    saldon        = {r["agent"]: float(r.get("saldo") or 0) for r in planbocker}
    oppna_zon_ids = {a["zon_id"] for a in oppna_aukt}
    zoner_map     = {r["id"]: r for r in zoner_all}

    print(f"\nMarkägare: {len(agare_rows)}, Öppna auktioner: {len(oppna_aukt)}")

    listade    = lista_zoner(agare_rows, oppna_zon_ids, zoner_map)
    oppna_aukt = sb_get(f"mark_auktioner?select=*&status=eq.{OPPEN}")
    bud        = lagg_bud(oppna_aukt, saldon)

    print(f"\nKörning klar. {affarer} affärer, {listade} nya auktioner, {bud} bud.")


if __name__ == "__main__":
    main()
