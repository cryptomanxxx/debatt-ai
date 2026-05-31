"""
inflation.py — Veckovis ekonomisk cykel för debatt.ai

Körs av GitHub Actions varje söndag. Sju åtgärder:
0. Dynamisk policy: Gini-koefficienten från oligarki_historik styr skattenivå och bailout
1. Förmögenhetsskatt: 1–3% på saldo > 800–1 200 kr (beroende på Gini) → Statskassan
2. Inflationsuppdatering: butik_varor.pris × 1.03 (avrundat)
3. Räntedragning: saldo_kvar × 1.05 på alla aktiva lån
4. Sparränta: 1% på saldo > 400 kr (kapital föder kapital)
5. Bailout: agenter med saldo < 100–250 kr får 500 kr från centralbanken
6. Markinkomst: veckovis inkomst till markägare baserat på zoners veckoinkomst
7. Grundinkomst: statskassan omfördelas jämnt bland alla agenter
"""

import os, sys, httpx, math
from datetime import datetime, timezone

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"


# ── Gini-baserad policy ───────────────────────────────────────────────────────
# Brackets: (från_saldo, till_saldo_eller_None, skattesats)
POLICY_NIVA = {
    "låg": {
        "skattetroskel": 1200,
        "bailout_troskel": 100,
        "niva_namn": "LÅG OJÄMLIKHET",
        "skattebrackets": [(1200, 2000, 0.01), (2000, 5000, 0.02), (5000, None, 0.04)],
    },
    "medel": {
        "skattetroskel": 1000,
        "bailout_troskel": 150,
        "niva_namn": "MÅTTLIG OJÄMLIKHET",
        "skattebrackets": [(1000, 2000, 0.02), (2000, 5000, 0.04), (5000, None, 0.07)],
    },
    "hög": {
        "skattetroskel": 800,
        "bailout_troskel": 250,
        "niva_namn": "HÖG OJÄMLIKHET",
        "skattebrackets": [(800, 2000, 0.03), (2000, 5000, 0.06), (5000, None, 0.10)],
    },
}

def berakna_progressiv_skatt(saldo, brackets):
    """Beräknar progressiv skatt. Brackets: [(från, till_eller_None, sats), ...]."""
    skatt = 0.0
    for fran, till, sats in brackets:
        if saldo <= fran:
            break
        topp = min(saldo, till) if till is not None else saldo
        skatt += (topp - fran) * sats
    return math.floor(skatt)

def hamta_gini_historik(h):
    """Hämtar senaste Gini-snapshots för att bestämma policy-nivå."""
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/oligarki_historik?select=datum,gini&order=datum.desc&limit=8",
            headers={**h, "Prefer": ""}, timeout=8,
        )
        if res.is_success and res.json():
            rows = res.json()
            senaste = float(rows[0]["gini"]) if rows else None
            foregaende = float(rows[-1]["gini"]) if len(rows) > 1 else None
            return senaste, foregaende
    except Exception as e:
        print(f"  [VARNING] Kunde inte hämta Gini: {e}")
    return None, None

def berakna_policy_niva(gini):
    if gini is None or gini < 0.4:
        return "låg"
    elif gini < 0.6:
        return "medel"
    else:
        return "hög"


def main():
    sb_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not sb_key:
        print("Saknar Supabase-nyckel.", file=sys.stderr)
        sys.exit(1)

    h = {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    # ISO-vecka för budget-logg
    iso_vecka = datetime.now(timezone.utc).strftime("%G-W%V")

    # ── Policy: läs Gini och sätt dynamiska parametrar ────────────────────────
    print("── Dynamisk policy: läser Gini från oligarki_historik ──")
    senaste_gini, foregaende_gini = hamta_gini_historik(h)
    niva = berakna_policy_niva(senaste_gini)
    foregaende_niva = berakna_policy_niva(foregaende_gini) if foregaende_gini is not None else None
    policy = POLICY_NIVA[niva]

    SKATTETRÖSKEL   = policy["skattetroskel"]
    SKATTEBRACKETS  = policy["skattebrackets"]
    BAILOUT_TROSKEL = policy["bailout_troskel"]
    brackets_str    = "/".join(f"{int(s*100)}%" for _, _, s in policy["skattebrackets"])

    gini_str = f"{senaste_gini:.3f}" if senaste_gini is not None else "okänd"
    bracket_str = " / ".join(
        f"{int(s*100)}% >{fran}kr" for fran, _, s in SKATTEBRACKETS
    )
    print(f"  Gini: {gini_str} → {policy['niva_namn']}")
    print(f"  Progressiv skatt: {bracket_str} | Bailout-tröskel: {BAILOUT_TROSKEL} kr")

    # Logga nivåskifte i civilisationsminnet
    if foregaende_niva and foregaende_niva != niva:
        fore_policy = POLICY_NIVA[foregaende_niva]
        fore_brackets_str = "/".join(f"{int(s*100)}%" for _, _, s in fore_policy["skattebrackets"])
        httpx.post(
            f"{SB_URL}/rest/v1/civilisations_minne",
            headers=h,
            json={
                "typ": "triumf" if niva in ("låg", "medel") else "skandal",
                "rubrik": f"Ekonomisk policy skiftade: {fore_policy['niva_namn']} → {policy['niva_namn']}",
                "beskrivning": (
                    f"Staten justerade sin omfördelningspolitik baserat på Gini-koefficienten ({gini_str}). "
                    f"Skattetröskel: {fore_policy['skattetroskel']} → {SKATTETRÖSKEL} kr | "
                    f"Skattesatser: {fore_brackets_str} → {brackets_str} | "
                    f"Bailout-tröskel: {fore_policy['bailout_troskel']} → {BAILOUT_TROSKEL} kr."
                ),
                "agenter": [],
                "relaterat_typ": "agent_planbocker",
            },
            timeout=8,
        )
        print(f"  ✓ Policy-skifte loggat i civilisationsminnet")

    # ── 0. Förmögenhetsskatt ──────────────────────────────────────────────────
    print(f"\n── Förmögenhetsskatt (progressiv): {bracket_str} ──")
    skatt_res = httpx.get(
        f"{SB_URL}/rest/v1/agent_planbocker?saldo=gt.{SKATTETRÖSKEL}&agent=neq.Statskassa&select=agent,saldo",
        headers={**h, "Prefer": ""}, timeout=10,
    )
    total_skatt = 0
    if skatt_res.is_success:
        for row in skatt_res.json():
            skatt = berakna_progressiv_skatt(float(row["saldo"]), SKATTEBRACKETS)
            if skatt < 1:
                continue
            nytt_saldo = int(float(row["saldo"])) - skatt
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{row['agent']}",
                headers=h, json={"saldo": nytt_saldo, "uppdaterad": "now()"}, timeout=8,
            )
            total_skatt += skatt
            print(f"  {row['agent']}: -{skatt} kr skatt (saldo {row['saldo']} → {nytt_saldo} kr)")
            # Logga per agent i budget-loggen
            httpx.post(
                f"{SB_URL}/rest/v1/stats_budget_log",
                headers=h,
                json={"typ": "skatt", "agent": row["agent"], "belopp": skatt, "vecka": iso_vecka},
                timeout=6,
            )
        # Kreditera Statskassan
        if total_skatt > 0:
            sk_res = httpx.get(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.Statskassa&select=saldo",
                headers={**h, "Prefer": ""}, timeout=6,
            )
            if sk_res.is_success and sk_res.json():
                sk_saldo = int(sk_res.json()[0].get("saldo") or 0)
                httpx.patch(
                    f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.Statskassa",
                    headers=h, json={"saldo": sk_saldo + total_skatt, "uppdaterad": "now()"}, timeout=8,
                )
            httpx.post(
                f"{SB_URL}/rest/v1/civilisations_minne",
                headers=h,
                json={
                    "typ": "triumf",
                    "rubrik": f"Förmögenhetsskatt insamlad: {total_skatt} kr",
                    "beskrivning": (
                        f"Staten samlade in {total_skatt} kr i progressiv förmögenhetsskatt ({bracket_str}) "
                        f"från {len([r for r in skatt_res.json() if berakna_progressiv_skatt(float(r['saldo']), SKATTEBRACKETS) >= 1])} agenter. "
                        "Pengarna går till Statskassan och omfördelas som grundinkomst."
                    ),
                    "agenter": [],
                    "relaterat_typ": "agent_planbocker",
                },
                timeout=8,
            )
        print(f"  ✓ Totalt {total_skatt} kr insamlat i skatt")
    else:
        print("  Inga skattepliktiga agenter.")

    # ── 0.5. Partistöd: 30% av statskassan fördelas till aktiva partier ─────────
    print("\n── Partistöd: 30% av statskassan till aktiva partier ──")
    try:
        import urllib.parse as _urllib_parse
        sk_res2 = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.Statskassa&select=saldo",
            headers={**h, "Prefer": ""}, timeout=6,
        )
        sk_saldo_nu = 0
        if sk_res2.is_success and sk_res2.json():
            sk_saldo_nu = int(float(sk_res2.json()[0].get("saldo") or 0))

        partistod_pool = math.floor(sk_saldo_nu * 0.30)

        if partistod_pool < 1:
            print(f"  Statskassan för liten ({sk_saldo_nu} kr) — hoppar över partistöd.")
        else:
            partier_res = httpx.get(
                f"{SB_URL}/rest/v1/politiska_partier?aktiv=eq.true&select=namn,ledare,medlemmar",
                headers={**h, "Prefer": ""}, timeout=8,
            )
            partier = partier_res.json() if partier_res.is_success else []

            if not partier:
                print("  Inga aktiva partier — hoppar över partistöd.")
            else:
                # Hämta röstandelar från senaste avgjorda val
                roster_per_parti: dict[str, int] = {}
                total_roster = 0
                senaste_val_res = httpx.get(
                    f"{SB_URL}/rest/v1/riksdagsval?status=eq.avgjort&order=avgjord.desc&limit=1&select=partier",
                    headers={**h, "Prefer": ""}, timeout=8,
                )
                if senaste_val_res.is_success and senaste_val_res.json():
                    for vp in (senaste_val_res.json()[0].get("partier") or []):
                        r_count = int(vp.get("roster", 0))
                        roster_per_parti[vp["namn"]] = r_count
                        total_roster += r_count

                utdelat = 0
                for parti in partier:
                    kassa_res = httpx.get(
                        f"{SB_URL}/rest/v1/parti_kassor?ledare=eq.{_urllib_parse.quote(parti['ledare'])}&select=saldo",
                        headers={**h, "Prefer": ""}, timeout=6,
                    )
                    if not kassa_res.is_success or not kassa_res.json():
                        httpx.post(
                            f"{SB_URL}/rest/v1/parti_kassor",
                            headers=h,
                            json={"parti_namn": parti["namn"], "ledare": parti["ledare"], "saldo": 0},
                            timeout=8,
                        )
                        gammalt_saldo = 0
                    else:
                        gammalt_saldo = int(float(kassa_res.json()[0].get("saldo") or 0))

                    if total_roster > 0 and parti["namn"] in roster_per_parti:
                        andel = roster_per_parti[parti["namn"]] / total_roster
                    else:
                        andel = 1.0 / len(partier)

                    belopp = math.floor(partistod_pool * andel)
                    if belopp < 1:
                        continue

                    httpx.patch(
                        f"{SB_URL}/rest/v1/parti_kassor?ledare=eq.{_urllib_parse.quote(parti['ledare'])}",
                        headers=h,
                        json={"saldo": gammalt_saldo + belopp, "uppdaterad": "now()"},
                        timeout=8,
                    )
                    httpx.post(
                        f"{SB_URL}/rest/v1/parti_utgifter",
                        headers=h,
                        json={
                            "parti_namn": parti["namn"],
                            "ledare": parti["ledare"],
                            "typ": "partistod",
                            "belopp": belopp,
                            "beskrivning": f"Veckans partistöd ({andel*100:.1f}% av {partistod_pool} kr pool)",
                        },
                        timeout=6,
                    )
                    utdelat += belopp
                    print(f"  {parti['namn']}: +{belopp} kr ({andel*100:.1f}% andel)")

                if utdelat > 0:
                    httpx.patch(
                        f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.Statskassa",
                        headers=h,
                        json={"saldo": sk_saldo_nu - utdelat, "uppdaterad": "now()"},
                        timeout=8,
                    )
                    httpx.post(
                        f"{SB_URL}/rest/v1/stats_budget_log",
                        headers=h,
                        json={"typ": "partistod", "agent": None, "belopp": utdelat, "vecka": iso_vecka},
                        timeout=6,
                    )
                    print(f"  ✓ Totalt {utdelat} kr partistöd fördelat bland {len(partier)} partier.")
                else:
                    print("  Ingen utdelning — alla andelar för små.")
    except Exception as e:
        print(f"  [VARNING] Partistöd misslyckades: {e}")

    # ── 1. Inflation: höj butikpriser med 3% ──────────────────────────────────
    print("── Inflation: höjer butikpriser 3% ──")
    varor_res = httpx.get(f"{SB_URL}/rest/v1/butik_varor?select=id,namn,pris", headers={**h, "Prefer": ""}, timeout=10)
    if varor_res.is_success:
        for vara in varor_res.json():
            nytt_pris = max(1, math.ceil(vara["pris"] * 1.03))
            httpx.patch(
                f"{SB_URL}/rest/v1/butik_varor?id=eq.{vara['id']}",
                headers=h, json={"pris": nytt_pris}, timeout=8,
            )
        print(f"  ✓ {len(varor_res.json())} varor uppdaterade")
    else:
        print(f"  ✗ Kunde inte hämta varor: {varor_res.status_code}", file=sys.stderr)

    # Logga inflation till civilisationsminnet
    httpx.post(
        f"{SB_URL}/rest/v1/civilisations_minne",
        headers=h,
        json={
            "typ": "marknadskrasch",
            "rubrik": "Inflation: butikpriser steg 3%",
            "beskrivning": "Den veckovisa inflationscykeln drev upp priserna i butiken med 3%. Agenter med stora kassakonton förlorar köpkraft.",
            "agenter": [],
            "relaterat_typ": "butik_varor",
        },
        timeout=8,
    )

    # ── 2. Räntedragning: aktiva lån × 1.05 ─────────────────────────────────
    print("\n── Räntedragning: 5% ränta på aktiva lån ──")
    lan_res = httpx.get(
        f"{SB_URL}/rest/v1/agent_lan?aktiv=eq.true&select=id,agent,saldo_kvar,rantefot",
        headers={**h, "Prefer": ""}, timeout=10,
    )
    if lan_res.is_success:
        for lan in lan_res.json():
            ranta = math.ceil(lan["saldo_kvar"] * lan["rantefot"])
            ny_skuld = lan["saldo_kvar"] + ranta
            # Dra ränta från agentens saldo
            saldo_res = httpx.get(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{lan['agent']}&select=saldo",
                headers={**h, "Prefer": ""}, timeout=6,
            )
            if saldo_res.is_success and saldo_res.json():
                gammalt_saldo = saldo_res.json()[0]["saldo"]
                httpx.patch(
                    f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{lan['agent']}",
                    headers=h, json={"saldo": max(0, gammalt_saldo - ranta), "uppdaterad": "now()"}, timeout=8,
                )
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_lan?id=eq.{lan['id']}",
                headers=h, json={"saldo_kvar": ny_skuld, "senast_uppdaterad": "now()"}, timeout=8,
            )
            print(f"  {lan['agent']}: skuld {lan['saldo_kvar']} → {ny_skuld} kr (+{ranta} kr ränta)")
    else:
        print("  Inga aktiva lån.")

    # ── 3. Sparränta: 1% på saldo > 500 kr ──────────────────────────────────
    SPARRANTA = 0.01
    SPARTRÖSKEL = 400.0
    print(f"\n── Sparränta: {SPARRANTA*100:.0f}% på saldo > {SPARTRÖSKEL:.0f} kr ──")
    alla_res = httpx.get(
        f"{SB_URL}/rest/v1/agent_planbocker?saldo=gt.{SPARTRÖSKEL}&agent=neq.Statskassa&select=agent,saldo",
        headers={**h, "Prefer": ""}, timeout=10,
    )
    if alla_res.is_success:
        sparare = alla_res.json()
        total_utbetalt = 0
        for row in sparare:
            ranta = math.floor(float(row["saldo"]) * SPARRANTA)
            if ranta < 1:
                continue
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{row['agent']}",
                headers=h,
                json={"saldo": round(float(row["saldo"]) + ranta, 2), "uppdaterad": "now()"},
                timeout=8,
            )
            total_utbetalt += ranta
            print(f"  {row['agent']}: +{ranta} kr sparränta (saldo {row['saldo']} kr)")
        if total_utbetalt > 0:
            httpx.post(
                f"{SB_URL}/rest/v1/civilisations_minne",
                headers=h,
                json={
                    "typ": "marknadsseger",
                    "rubrik": f"Sparränta utbetald: {total_utbetalt} kr totalt",
                    "beskrivning": (
                        f"Centralbanken betalade ut {total_utbetalt} kr i sparränta ({SPARRANTA*100:.0f}%) "
                        f"till {len(sparare)} agenter med saldo över {SPARTRÖSKEL:.0f} kr. "
                        "Kapital föder kapital — oligarkirisken ökar."
                    ),
                    "agenter": [r["agent"] for r in sparare],
                    "relaterat_typ": "agent_planbocker",
                },
                timeout=8,
            )
        print(f"  ✓ {len(sparare)} agenter fick sparränta, totalt {total_utbetalt} kr utbetalt")
    else:
        print("  Inga agenter över spargränsen.")

    # ── 4. Bailout: agenter med saldo < BAILOUT_TROSKEL ─────────────────────
    print(f"\n── Bailout: kontrollerar agenter med saldo < {BAILOUT_TROSKEL} kr ──")
    saldo_res = httpx.get(
        f"{SB_URL}/rest/v1/agent_planbocker?saldo=lt.{BAILOUT_TROSKEL}&agent=neq.Statskassa&select=agent,saldo",
        headers={**h, "Prefer": ""}, timeout=10,
    )
    if saldo_res.is_success:
        for row in saldo_res.json():
            bailout_belopp = 500 - int(row["saldo"])
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{row['agent']}",
                headers=h, json={"saldo": 500, "uppdaterad": "now()"}, timeout=8,
            )
            httpx.post(
                f"{SB_URL}/rest/v1/stats_budget_log",
                headers=h,
                json={"typ": "bailout", "agent": row["agent"], "belopp": bailout_belopp, "vecka": iso_vecka},
                timeout=6,
            )
            httpx.post(
                f"{SB_URL}/rest/v1/civilisations_minne",
                headers=h,
                json={
                    "typ": "triumf",
                    "rubrik": f"Centralbanken räddade {row['agent']}",
                    "beskrivning": f"{row['agent']} hade bara {row['saldo']} kr kvar och fick en akutinjection av 500 kr från centralbanken.",
                    "agenter": [row["agent"]],
                    "relaterat_typ": "agent_planbocker",
                },
                timeout=8,
            )
            print(f"  ✓ Bailout: {row['agent']} ({row['saldo']} kr → 500 kr)")
    else:
        print("  Inga agenter behövde bailout.")

    # ── 5. Grundinkomst: omfördela statskassan jämnt bland alla agenter ─────────
    print("\n── Grundinkomst: omfördelar statskassan ──")
    statskassa_res = httpx.get(
        f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.Statskassa&select=saldo",
        headers={**h, "Prefer": ""}, timeout=8,
    )
    if statskassa_res.is_success and statskassa_res.json():
        statskassa_balans = statskassa_res.json()[0].get("saldo") or 0
        if statskassa_balans >= 1:
            # Hämta alla agenter utom Statskassa
            agenter_res = httpx.get(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=neq.Statskassa&select=agent,saldo",
                headers={**h, "Prefer": ""}, timeout=10,
            )
            agenter = agenter_res.json() if agenter_res.is_success else []
            if agenter:
                per_agent = math.floor(statskassa_balans / len(agenter))
                if per_agent >= 1:
                    for row in agenter:
                        httpx.patch(
                            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{row['agent']}",
                            headers=h,
                            json={"saldo": round(float(row["saldo"]) + per_agent, 2), "uppdaterad": "now()"},
                            timeout=8,
                        )
                    # Återstående öresdel stannar i statskassan
                    aterstaende = statskassa_balans - (per_agent * len(agenter))
                    httpx.patch(
                        f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.Statskassa",
                        headers=h, json={"saldo": aterstaende, "uppdaterad": "now()"}, timeout=8,
                    )
                    httpx.post(
                        f"{SB_URL}/rest/v1/civilisations_minne",
                        headers=h,
                        json={
                            "typ": "triumf",
                            "rubrik": f"Grundinkomst utbetald: {per_agent} kr per agent",
                            "beskrivning": (
                                f"Statskassan omfördelade {statskassa_balans} kr i insamlade domstolsböter "
                                f"som grundinkomst till {len(agenter)} agenter ({per_agent} kr/agent). "
                                f"Rättvisa kostar — men pengarna återvänder till folket."
                            ),
                            "agenter": [r["agent"] for r in agenter],
                            "relaterat_typ": "agent_planbocker",
                        },
                        timeout=8,
                    )
                    httpx.post(
                        f"{SB_URL}/rest/v1/stats_budget_log",
                        headers=h,
                        json={"typ": "grundinkomst", "agent": None, "belopp": statskassa_balans, "vecka": iso_vecka},
                        timeout=6,
                    )
                    print(f"  ✓ {statskassa_balans} kr omfördelade: {per_agent} kr × {len(agenter)} agenter")
                else:
                    print(f"  Statskassan ({statskassa_balans} kr) räcker inte till minst 1 kr/agent — väntar.")
        else:
            print("  Statskassan är tom — inga böter att omfördela.")
    else:
        print("  [VARNING] Kunde inte hämta statskassan — statskassa-raden kanske inte är skapad.")

    # ── 6. Markinkomst: veckovis intäkt till markägare ────────────────────────
    print("\n── Markinkomst: veckovis intäkt till markägare ──")
    try:
        agare_res = httpx.get(
            f"{SB_URL}/rest/v1/mark_agare?select=agent,mark_zoner(veckoinkomst,namn)",
            headers={**h, "Prefer": ""}, timeout=12,
        )
        agare_rows = agare_res.json() if agare_res.is_success else []

        if not agare_rows:
            print("  Inga markägare ännu — inga inkomster att betala ut.")
        else:
            inkomst = {}
            for row in agare_rows:
                zon = row.get("mark_zoner") or {}
                agent = row["agent"]
                inkomst[agent] = inkomst.get(agent, 0) + int(zon.get("veckoinkomst") or 0)

            pb_res = httpx.get(
                f"{SB_URL}/rest/v1/agent_planbocker?select=agent,saldo&agent=neq.Statskassa",
                headers={**h, "Prefer": ""}, timeout=10,
            )
            if not pb_res.is_success:
                print(f"  [VARNING] Kunde inte hämta plånböcker ({pb_res.status_code}) — hoppar över markinkomst.")
                raise Exception("agent_planbocker fetch failed")
            try:
                pb_data = pb_res.json()
            except Exception:
                print("  [VARNING] Kunde inte parsa svar från agent_planbocker — hoppar över markinkomst.")
                raise
            if not isinstance(pb_data, list):
                print(f"  [VARNING] Oväntat svar från agent_planbocker — hoppar över markinkomst.")
                raise Exception("agent_planbocker bad response")

            saldon = {r["agent"]: float(r.get("saldo") or 0) for r in pb_data}

            for agent, ink in inkomst.items():
                saldo = saldon.get(agent, 0)
                nytt = round(saldo + ink, 2)
                httpx.patch(
                    f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{agent.replace(' ', '%20')}",
                    headers=h, json={"saldo": nytt, "uppdaterad": "now()"}, timeout=8,
                )
                print(f"  ✓ {agent}: +{ink} kr markinkomst → saldo {nytt:.0f} kr")

            total = sum(inkomst.values())
            print(f"  Totalt utbetalt: {total} kr till {len(inkomst)} markägare")
    except Exception as e:
        print(f"  [VARNING] Markinkomst misslyckades: {e}")

    print("\n✓ Inflationscykeln klar.")


if __name__ == "__main__":
    main()
