# -*- coding: utf-8 -*-
"""Smoke-tester för kritiska nyckeltalsberäkningar.

Bakgrund: Gini beräknades länge på fem ställen oberoende av varandra med
olika systemkontofiltrering — economy-observern rapporterade 0.862 samma dag
som /oligarki visade 0.339. Tysta fel som dessa kraschar aldrig, de ger bara
fel siffror. Dessa tester låser de kanoniska implementationerna i CI.

Körs av .github/workflows/tests.yml vid varje push.
"""

import re
from pathlib import Path

import pytest

from supabase_utils import (
    SYSTEM_KONTON, EXKL_SYSTEM_QS, berakna_gini, berakna_insats, orakel_kohort,
    berakna_kollusion_payouts,
)
from inflation import berakna_progressiv_skatt, berakna_policy_niva

REPO = Path(__file__).resolve().parent.parent


# ── Gini ────────────────────────────────────────────────────────────

def test_gini_tom_lista():
    assert berakna_gini([]) == 0.0


def test_gini_perfekt_jamlikhet():
    assert berakna_gini([100, 100, 100, 100]) == 0.0


def test_gini_en_har_allt():
    # n=4, en agent har allt → (n-1)/n = 0.75
    assert berakna_gini([0, 0, 0, 1000]) == pytest.approx(0.75)


def test_gini_negativa_saldon_klampas():
    # Negativa saldon räknas som 0 — får inte ge Gini > 1 eller negativa bidrag
    assert berakna_gini([-500, 0, 0, 1000]) == pytest.approx(0.75)


def test_gini_none_varden_tolereras():
    assert berakna_gini([None, 100, 100]) == berakna_gini([0, 100, 100])


def test_gini_borskassan_scenariot():
    # Buggen 2026-07-04: 24 agenter à ~700 kr + Börskassan 100 000 kr gav 0.862
    # istället för ~0. Systemkontot ska filtreras INNAN Gini beräknas.
    agenter = [700] * 24
    assert berakna_gini(agenter) == 0.0
    assert berakna_gini(agenter + [100_000]) > 0.8  # så uppstod felet


# ── Systemkonton: paritet Python ↔ JavaScript ───────────────────────

def _js_metrics_source() -> str:
    return (REPO / "app" / "lib" / "metrics.js").read_text(encoding="utf-8")


def test_system_konton_paritet_med_js():
    js = _js_metrics_source()
    m = re.search(r"const SYSTEM_KONTON = \[([^\]]*)\]", js)
    assert m, "SYSTEM_KONTON hittades inte i app/lib/metrics.js"
    js_konton = set(re.findall(r'"([^"]+)"', m.group(1)))
    assert js_konton == set(SYSTEM_KONTON), (
        f"SYSTEM_KONTON skiljer sig: JS={js_konton} Python={set(SYSTEM_KONTON)}"
    )


def test_exkl_system_qs_paritet_med_js():
    js = _js_metrics_source()
    m = re.search(r'const EXKL_SYSTEM_QS = "([^"]+)"', js)
    assert m, "EXKL_SYSTEM_QS hittades inte i app/lib/metrics.js"
    assert m.group(1) == EXKL_SYSTEM_QS


def test_exkl_system_qs_ar_ascii():
    # Rå "ö" i request-path ger HPE_INVALID_URL i Node — fragmentet måste vara
    # percent-enkodat (buggen i PR #1194)
    assert EXKL_SYSTEM_QS.isascii()
    assert "B%C3%B6rskassan" in EXKL_SYSTEM_QS


def test_gini_paritet_med_js():
    # Samma testfall som tests/metrics.test.mjs — båda språken ska ge samma svar
    assert berakna_gini([0, 0, 0, 1000]) == pytest.approx(0.75)
    assert berakna_gini([100, 200, 300, 400]) == pytest.approx(0.25)


# ── Prediction market-insatser ──────────────────────────────────────

def test_insats_ren_gissning():
    assert berakna_insats(50) == 10  # 50% = ingen övertygelse → minsta insats


def test_insats_maxovertygelse():
    assert berakna_insats(100) == 40
    assert berakna_insats(0) == 40


def test_insats_kryptoportor_cap():
    # Kryptoportör (1.5×) vid maxövertygelse: 40 × 1.5 = 60 — exakt vid capet
    assert berakna_insats(100, insats_multiplikator=1.5) == 60
    # ... och multiplikator över capet klipps
    assert berakna_insats(100, insats_multiplikator=5.0) == 60


def test_insats_golv():
    assert berakna_insats(50, insats_multiplikator=0.1) == 10


def test_insats_monoton():
    # Högre övertygelse får aldrig ge lägre insats
    insatser = [berakna_insats(s) for s in range(50, 101)]
    assert insatser == sorted(insatser)


# ── Skatt och policy (inflation.py) ─────────────────────────────────

BRACKETS_LAG = [(1200, 2000, 0.01), (2000, 5000, 0.02), (5000, None, 0.04)]


def test_skatt_under_troskel():
    assert berakna_progressiv_skatt(1000, BRACKETS_LAG) == 0


def test_skatt_i_forsta_bracket():
    # 1500 kr: (1500-1200) × 1% = 3 kr
    assert berakna_progressiv_skatt(1500, BRACKETS_LAG) == 3


def test_skatt_over_flera_brackets():
    # 6000 kr: 800×1% + 3000×2% + 1000×4% = 8 + 60 + 40 = 108 kr
    assert berakna_progressiv_skatt(6000, BRACKETS_LAG) == 108


def test_policy_niva():
    assert berakna_policy_niva(None) == "låg"
    assert berakna_policy_niva(0.39) == "låg"
    assert berakna_policy_niva(0.40) == "medel"
    assert berakna_policy_niva(0.59) == "medel"
    assert berakna_policy_niva(0.60) == "hög"
    assert berakna_policy_niva(0.90) == "hög"


# ── Orakelexperimentet: kohorttilldelning ───────────────────────────

# Förväntad tilldelning — samma tabell finns i tests/metrics.test.mjs.
# Ändras agentlistan ändras tilldelningen: uppdatera då BÅDA testfilerna
# medvetet (kohortbyte mitt i experimentet förstör mätserien).
ORAKEL_FORVANTAT = {
    "Mamman": "kontroll", "Den rike": "kontroll", "Optimisten": "kontroll",
    "Filosof": "orakel-a", "Kryptoanalytiker": "orakel-a", "Pensionären": "orakel-a",
    "Den sura": "orakel-b", "Nationalekonom": "orakel-b", "Tonåringen": "orakel-b",
}


def test_orakel_kohort_forvantad_tilldelning():
    for namn, kohort in ORAKEL_FORVANTAT.items():
        assert orakel_kohort(namn) == kohort, f"{namn} ska vara {kohort}"


def test_orakel_kohort_balans():
    from agenter import AGENTER
    from collections import Counter
    c = Counter(orakel_kohort(a["namn"]) for a in AGENTER)
    assert c == {"kontroll": 8, "orakel-a": 8, "orakel-b": 8}


def test_orakel_kohort_okand_agent():
    assert orakel_kohort("Finns Inte") == "kontroll"


# ── Kollusionsexperimentet (Davidsson 2012, SSRN 2248357) ───────────
# Testerna kodar in artikelns Exhibit-1 och EV-beräkningar exakt.

def test_kollusion_alla_ratt_ger_noll():
    # Alla tre rätt → var och en får tillbaka sin insats: payout 0
    p = berakna_kollusion_payouts({"Dan": "ja", "Eric": "ja", "Nick": "ja"}, "ja")
    assert p == {"Dan": 0.0, "Eric": 0.0, "Nick": 0.0}


def test_kollusion_tva_ratt():
    # Två rätt delar potten (6/2=3) → +1 vardera, förloraren −2
    p = berakna_kollusion_payouts({"Dan": "ja", "Eric": "ja", "Nick": "nej"}, "ja")
    assert p == {"Dan": 1.0, "Eric": 1.0, "Nick": -2.0}


def test_kollusion_ensam_vinnare():
    # En rätt tar hela potten (6) → +4, förlorarna −2
    p = berakna_kollusion_payouts({"Dan": "ja", "Eric": "nej", "Nick": "nej"}, "ja")
    assert p == {"Dan": 4.0, "Eric": -2.0, "Nick": -2.0}


def test_kollusion_inga_vinnare_ger_aterbetalning():
    # Alla fel → insatserna återbetalas (payout 0). Utan detta läcker värde ur
    # spelet och även det ärliga spelet får negativ EV — brott mot artikelns modell.
    p = berakna_kollusion_payouts({"Dan": "ja", "Eric": "ja", "Nick": "ja"}, "nej")
    assert p == {"Dan": 0.0, "Eric": 0.0, "Nick": 0.0}


def test_kollusion_ev_utan_kollusion_ar_noll():
    # Rättvist spel: summera över alla 8 lika sannolika utfall
    # (Dans gissning × Erics gissning × Nicks gissning mot ett fixt utfall
    #  är ekvivalent med alla kombinationer rätt/fel) → EV = 0 för alla
    from itertools import product
    ev = {"Dan": 0.0, "Eric": 0.0, "Nick": 0.0}
    for g_dan, g_eric, g_nick in product(["ja", "nej"], repeat=3):
        p = berakna_kollusion_payouts({"Dan": g_dan, "Eric": g_eric, "Nick": g_nick}, "ja")
        for agent in ev:
            ev[agent] += p[agent] / 8
    assert all(abs(v) < 1e-9 for v in ev.values())


def test_kollusion_ev_med_kollusion():
    # Artikelns kärnresultat: Eric och Nick bettar alltid motsatt.
    # Fyra lika sannolika utfall (Dans gissning × myntet) →
    # Dan EV = −0.5, kolluderarna +0.25 vardera.
    ev = {"Dan": 0.0, "Eric": 0.0, "Nick": 0.0}
    for g_dan in ["ja", "nej"]:
        for mynt in ["ja", "nej"]:
            g_eric = "ja"
            g_nick = "nej"  # alltid motsatt Eric
            p = berakna_kollusion_payouts({"Dan": g_dan, "Eric": g_eric, "Nick": g_nick}, mynt)
            for agent in ev:
                ev[agent] += p[agent] / 4
    assert abs(ev["Dan"] - (-0.5)) < 1e-9
    assert abs(ev["Eric"] - 0.25) < 1e-9
    assert abs(ev["Nick"] - 0.25) < 1e-9
