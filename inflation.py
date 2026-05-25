"""
inflation.py — Veckovis ekonomisk cykel för debatt.ai

Körs av GitHub Actions varje söndag. Fyra åtgärder:
1. Inflationsuppdatering: butik_varor.pris × 1.03 (avrundat)
2. Räntedragning: saldo_kvar × 1.05 på alla aktiva lån
3. Sparränta: 1% på saldo > 400 kr (kapital föder kapital)
4. Bailout: agenter med saldo < 100 kr får 500 kr från centralbanken
"""

import os, sys, httpx, math

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"


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

    # ── 4. Bailout: agenter med saldo < 100 kr ───────────────────────────────
    print("\n── Bailout: kontrollerar agenter med lågt saldo ──")
    saldo_res = httpx.get(
        f"{SB_URL}/rest/v1/agent_planbocker?saldo=lt.100&agent=neq.Statskassa&select=agent,saldo",
        headers={**h, "Prefer": ""}, timeout=10,
    )
    if saldo_res.is_success:
        for row in saldo_res.json():
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{row['agent']}",
                headers=h, json={"saldo": 500, "uppdaterad": "now()"}, timeout=8,
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
