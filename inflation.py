"""
inflation.py — Veckovis ekonomisk cykel för debatt.ai

Körs av GitHub Actions varje söndag. Tre åtgärder:
1. Inflationsuppdatering: butik_varor.pris × 1.03 (avrundat)
2. Räntedragning: saldo_kvar × 1.05 på alla aktiva lån
3. Bailout: agenter med saldo < 100 kr får 500 kr från centralbanken
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

    # ── 3. Bailout: agenter med saldo < 100 kr ───────────────────────────────
    print("\n── Bailout: kontrollerar agenter med lågt saldo ──")
    saldo_res = httpx.get(
        f"{SB_URL}/rest/v1/agent_planbocker?saldo=lt.100&select=agent,saldo",
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

    print("\n✓ Inflationscykeln klar.")


if __name__ == "__main__":
    main()
