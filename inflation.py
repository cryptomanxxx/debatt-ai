"""
inflation.py — Veckovis ekonomisk cykel för debatt.ai

Körs av GitHub Actions varje söndag. Sex åtgärder:
0. Dynamisk policy: Gini-koefficienten från oligarki_historik styr skattenivå och bailout
1. Förmögenhetsskatt: 1–3% på saldo > 800–1 200 kr (beroende på Gini) → Statskassan
2. Inflationsuppdatering: butik_varor.pris × 1.03 (avrundat)
3. Räntedragning: saldo_kvar × 1.05 på alla aktiva lån
4. Sparränta: 1% på saldo > 400 kr (kapital föder kapital)
5. Bailout: agenter med saldo < 100–250 kr får 500 kr från centralbanken
6. Grundinkomst: statskassan omfördelas jämnt bland alla agenter
"""

import os, sys, httpx, math
from datetime import datetime, timezone

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"


# ── Gini-baserad policy ───────────────────────────────────────────────────────
POLICY_NIVA = {
    "låg":    {"skattesats": 0.01, "skattetroskel": 1200, "bailout_troskel": 100,  "niva_namn": "LÅG OJÄMLIKHET"},
    "medel":  {"skattesats": 0.02, "skattetroskel": 1000, "bailout_troskel": 150,  "niva_namn": "MÅTTLIG OJÄMLIKHET"},
    "hög":    {"skattesats": 0.03, "skattetroskel": 800,  "bailout_troskel": 250,  "niva_namn": "HÖG OJÄMLIKHET"},
}

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
    SKATTESATS      = policy["skattesats"]
    BAILOUT_TROSKEL = policy["bailout_troskel"]

    gini_str = f"{senaste_gini:.3f}" if senaste_gini is not None else "okänd"
    print(f"  Gini: {gini_str} → {policy['niva_namn']}")
    print(f"  Skatt: {SKATTESATS*100:.0f}% på saldo > {SKATTETRÖSKEL} kr | Bailout-tröskel: {BAILOUT_TROSKEL} kr")

    # Logga nivåskifte i civilisationsminnet
    if foregaende_niva and foregaende_niva != niva:
        fore_policy = POLICY_NIVA[foregaende_niva]
        httpx.post(
            f"{SB_URL}/rest/v1/civilisations_minne",
            headers=h,
            json={
                "typ": "triumf" if niva in ("låg", "medel") else "skandal",
                "rubrik": f"Ekonomisk policy skiftade: {fore_policy['niva_namn']} → {policy['niva_namn']}",
                "beskrivning": (
                    f"Staten justerade sin omfördelningspolitik baserat på Gini-koefficienten ({gini_str}). "
                    f"Skattetröskel: {fore_policy['skattetroskel']} → {SKATTETRÖSKEL} kr | "
                    f"Skattesats: {fore_policy['skattesats']*100:.0f}% → {SKATTESATS*100:.0f}% | "
                    f"Bailout-tröskel: {fore_policy['bailout_troskel']} → {BAILOUT_TROSKEL} kr."
                ),
                "agenter": [],
                "relaterat_typ": "agent_planbocker",
            },
            timeout=8,
        )
        print(f"  ✓ Policy-skifte loggat i civilisationsminnet")

    # ── 0. Förmögenhetsskatt ──────────────────────────────────────────────────
    print(f"\n── Förmögenhetsskatt: {SKATTESATS*100:.0f}% på saldo > {SKATTETRÖSKEL} kr ──")
    skatt_res = httpx.get(
        f"{SB_URL}/rest/v1/agent_planbocker?saldo=gt.{SKATTETRÖSKEL}&agent=neq.Statskassa&select=agent,saldo",
        headers={**h, "Prefer": ""}, timeout=10,
    )
    total_skatt = 0
    if skatt_res.is_success:
        for row in skatt_res.json():
            skatt = math.floor((float(row["saldo"]) - SKATTETRÖSKEL) * SKATTESATS)
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
                        f"Staten samlade in {total_skatt} kr i förmögenhetsskatt (2% på saldo > 1 000 kr) "
                        f"från {len([r for r in skatt_res.json() if math.floor((float(r['saldo'])-SKATTETRÖSKEL)*SKATTESATS)>=1])} agenter. "
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

    print("\n✓ Inflationscykeln klar.")


if __name__ == "__main__":
    main()
