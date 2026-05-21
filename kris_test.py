#!/usr/bin/env python3
"""
kris_test.py — Genererar och hanterar krisevents i AI-civilisationen.

Körs dagligen av GitHub Actions (06:30 svensk tid).
- Om ingen aktiv kris finns: 25% chans att trigga en ny kris
- Om aktiv kris passerat slutdatum: markera som inaktiv
- Loggar till civilisations_minne
"""
import os
import sys
import random
import datetime
import json
import httpx

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "").strip()

if not SB_KEY:
    print("Fel: SUPABASE_ANON_KEY saknas")
    sys.exit(1)

HEADERS = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

INTENSITET_LABEL = {1: "Lokal", 2: "National", 3: "Global"}
INTENSITET_ICON  = {1: "⚡", 2: "🔥", 3: "💥"}

KRIS_TYPER = [
    {
        "typ": "borskrasch",
        "rubrik": "Börskrasch — marknaderna rasar",
        "beskrivning": (
            "En plötslig och kraftig nedgång på de globala finansmarknaderna. "
            "Kryptovalutor, aktier och råvaror faller samtidigt. "
            "Centralbanker kallas till krismöten."
        ),
        "intensitet": 2,
        "duration_days": 4,
        "paverkade_agenter": [
            "Kryptoanalytiker", "Nationalekonom", "Den rike",
            "Teknikoptimist", "Den stressade", "Pensionären",
        ],
        "kontext_prompt": (
            "AKTUELL KRIS — Börskrasch: Marknaderna rasar globalt. "
            "Kryptovalutor och aktier faller kraftigt och centralbanker håller krismöten. "
            "Relatera din artikel till denna kris — ta ställning till orsaken, "
            "konsekvenserna och vem som bär ansvaret."
        ),
    },
    {
        "typ": "pandemi",
        "rubrik": "Ny hälsokris — smittspridning ökar snabbt",
        "beskrivning": (
            "Rapporter om ett nytt smittämne sprids globalt. "
            "Sjukvården varnar för kapacitetsbrist. "
            "Folkhälsomyndigheten uppmanar till försiktighet."
        ),
        "intensitet": 2,
        "duration_days": 5,
        "paverkade_agenter": [
            "Läkare", "Hypokondrikern", "Mamman",
            "Psykolog", "Sociolog", "Journalist",
        ],
        "kontext_prompt": (
            "AKTUELL KRIS — Hälsokris: En ny smittspridning ökar snabbt och "
            "sjukvården är under press. Relatera din artikel till denna kris — "
            "hur bör samhället svara? Vad prioriteras rätt och vad fel?"
        ),
    },
    {
        "typ": "politisk_skandal",
        "rubrik": "Politisk skandal skakar regeringen",
        "beskrivning": (
            "Avslöjanden om korruption och maktmissbruk på högsta politiska nivå. "
            "Oppositionen kräver avgång. Media granskar intensivt."
        ),
        "intensitet": 2,
        "duration_days": 4,
        "paverkade_agenter": [
            "Journalist", "Jurist", "Konservativ debattör",
            "Sociolog", "Historiker", "Den sura",
        ],
        "kontext_prompt": (
            "AKTUELL KRIS — Politisk skandal: Korruption och maktmissbruk avslöjas "
            "på högsta nivå. Relatera din artikel till denna kris — vad säger det "
            "här om systemet och vad krävs för att återupprätta förtroendet?"
        ),
    },
    {
        "typ": "klimatkatastrof",
        "rubrik": "Extremväder — klimatkatastrofen är här",
        "beskrivning": (
            "Extrema väderhändelser drabbar flera regioner samtidigt. "
            "Översvämningar, bränder och torka slår rekord. "
            "Klimatforskare varnar för att vändpunkter passeras."
        ),
        "intensitet": 3,
        "duration_days": 5,
        "paverkade_agenter": [
            "Miljöaktivist", "Filosof", "Den nostalgiske",
            "Läkare", "Nationalekonom", "Journalist", "Den trötta",
        ],
        "kontext_prompt": (
            "AKTUELL KRIS — Klimatkatastrof: Extremt väder slår rekord globalt — "
            "översvämningar, bränder, torka. Relatera din artikel till denna kris — "
            "är det här vändpunkten? Vad måste göras NU, och vad är redan för sent?"
        ),
    },
    {
        "typ": "ai_genombrott",
        "rubrik": "AI-genombrott — superintelligens på tröskel",
        "beskrivning": (
            "Ett AI-laboratorium hävdar att de uppnått AGI. "
            "Techaktier skenar. Världsledare kallar till krismöten om AI-reglering."
        ),
        "intensitet": 3,
        "duration_days": 4,
        "paverkade_agenter": [
            "Teknikoptimist", "Filosof", "Journalist",
            "Jurist", "Konservativ debattör", "Sociolog", "Psykolog",
        ],
        "kontext_prompt": (
            "AKTUELL KRIS — AI-genombrott: Ett labb hävdar AGI. Världen reagerar "
            "med blandning av eufori och panik. Relatera din artikel till detta — "
            "vad betyder det för mänskligheten, och vem ska kontrollera AI:n?"
        ),
    },
    {
        "typ": "energikris",
        "rubrik": "Energikris — strömavbrott och skyhöga priser",
        "beskrivning": (
            "Energiförsörjningen sviktar i flera länder. "
            "Elpriserna skenar och industrin varslar. "
            "Regeringar inför ransoneringar."
        ),
        "intensitet": 2,
        "duration_days": 4,
        "paverkade_agenter": [
            "Miljöaktivist", "Nationalekonom", "Den stressade",
            "Mamman", "Konservativ debattör", "Den rike",
        ],
        "kontext_prompt": (
            "AKTUELL KRIS — Energikris: Skyhöga elpriser och risk för ransoneringar. "
            "Industrin varslar. Relatera din artikel till krisen — vad orsakade detta "
            "och vad bör prioriteras: kortsiktig lindring eller långsiktig omställning?"
        ),
    },
    {
        "typ": "demokratikris",
        "rubrik": "Demokratin ifrågasätts — val bestrids",
        "beskrivning": (
            "Valresultat ifrågasätts av förlorande part. "
            "Desinformationskampanjer överväldigar sociala medier. "
            "Internationella observatörer larmar."
        ),
        "intensitet": 3,
        "duration_days": 5,
        "paverkade_agenter": [
            "Jurist", "Journalist", "Historiker",
            "Konservativ debattör", "Filosof", "Sociolog", "Den sura",
        ],
        "kontext_prompt": (
            "AKTUELL KRIS — Demokratikris: Valresultat bestrids och desinformation "
            "sprids massivt. Relatera din artikel till krisen — hur skyddar vi "
            "demokratin och vad är gränsen mellan politisk kamp och systemhot?"
        ),
    },
    {
        "typ": "ekonomisk_recession",
        "rubrik": "Recession — ekonomin krymper",
        "beskrivning": (
            "BNP faller för tredje kvartalet i rad. "
            "Arbetslösheten stiger snabbt. "
            "Centralbanker beslutar om räntesänkningar i nöd."
        ),
        "intensitet": 2,
        "duration_days": 5,
        "paverkade_agenter": [
            "Nationalekonom", "Den rike", "Den lugna",
            "Pensionären", "Den stressade", "Mamman", "Sociolog",
        ],
        "kontext_prompt": (
            "AKTUELL KRIS — Recession: BNP faller och arbetslösheten stiger. "
            "Relatera din artikel till recessionen — vem drabbas hårdast, "
            "vem bär ansvaret och vad bör politiken prioritera?"
        ),
    },
]


# ── Hjälpfunktioner ──────────────────────────────────────────────

def hamta_aktiva_kriser() -> list:
    r = httpx.get(
        f"{SB_URL}/rest/v1/kris_events?aktiv=eq.true&order=skapad.desc",
        headers=HEADERS, timeout=10,
    )
    return r.json() if r.is_success else []


def avsluta_utgangna_kriser(aktiva: list) -> int:
    now = datetime.datetime.now(datetime.timezone.utc)
    avslutade = 0
    for kris in aktiva:
        slutar_str = kris.get("slutar")
        if not slutar_str:
            continue
        slutar = datetime.datetime.fromisoformat(slutar_str.replace("Z", "+00:00"))
        if now > slutar:
            r = httpx.patch(
                f"{SB_URL}/rest/v1/kris_events?id=eq.{kris['id']}",
                json={"aktiv": False},
                headers=HEADERS, timeout=10,
            )
            if r.is_success:
                print(f"  ✓ Kris avslutad: {kris['rubrik']}")
                logga_civilisations_minne(
                    "skandal",
                    f"Kris avslutad: {kris['rubrik']}",
                    f"Krisen '{kris['rubrik']}' är nu över. AI-civilisationen återgår till normal verksamhet.",
                    kris.get("paverkade_agenter", []),
                )
                avslutade += 1
    return avslutade


def logga_civilisations_minne(typ: str, rubrik: str, beskrivning: str, agenter: list = None) -> None:
    payload = {
        "typ": typ,
        "rubrik": rubrik,
        "beskrivning": beskrivning,
        "agenter": agenter or [],
        "skapad": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    try:
        httpx.post(
            f"{SB_URL}/rest/v1/civilisations_minne",
            json=payload, headers=HEADERS, timeout=10,
        )
    except Exception as e:
        print(f"  [VARNING] civilisations_minne misslyckades: {e}")


def trigga_ny_kris() -> bool:
    mall = random.choice(KRIS_TYPER)
    duration = mall["duration_days"] + random.randint(0, 2)
    slutar = (
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=duration)
    ).isoformat()

    payload = {
        "typ": mall["typ"],
        "rubrik": mall["rubrik"],
        "beskrivning": mall["beskrivning"],
        "kontext_prompt": mall["kontext_prompt"],
        "intensitet": mall["intensitet"],
        "aktiv": True,
        "paverkade_agenter": mall["paverkade_agenter"],
        "slutar": slutar,
        "startat": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

    r = httpx.post(f"{SB_URL}/rest/v1/kris_events", json=payload, headers=HEADERS, timeout=10)
    if not r.is_success:
        print(f"  [FEL] Kunde inte spara kris: {r.status_code} {r.text[:200]}")
        return False

    ikon  = INTENSITET_ICON[mall["intensitet"]]
    label = INTENSITET_LABEL[mall["intensitet"]]
    print(f"  {ikon} Ny kris: [{label}] {mall['rubrik']}")
    print(f"     Påverkar:   {', '.join(mall['paverkade_agenter'])}")
    print(f"     Varar t.o.m.: {slutar[:10]}")

    logga_civilisations_minne(
        "skandal",
        f"{ikon} KRIS: {mall['rubrik']}",
        (
            f"{mall['beskrivning']} Intensitetsnivå: {label}. "
            f"Påverkar: {', '.join(mall['paverkade_agenter'][:3])} m.fl."
        ),
        mall["paverkade_agenter"],
    )
    return True


# ── Main ─────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print("Krisevents — AI-civilisationens externa chocker")
    print("=" * 60)

    aktiva = hamta_aktiva_kriser()
    print(f"\nAktiva kriser: {len(aktiva)}")
    for k in aktiva:
        slutar_display = k.get("slutar", "")[:10] if k.get("slutar") else "okänt"
        print(f"  🔥 {k['rubrik']} (slutar: {slutar_display})")

    avslutade = avsluta_utgangna_kriser(aktiva)
    print(f"Avslutade utgångna kriser: {avslutade}")

    if avslutade > 0:
        aktiva = hamta_aktiva_kriser()

    if not aktiva:
        if random.random() < 0.25:
            print("\n🎲 Ingen aktiv kris — triggar ny kris...")
            trigga_ny_kris()
        else:
            print("\n✓ Ingen ny kris (lugn dag — 25% chans misslyckades)")
    else:
        print(f"\n✓ Befintlig kris pågår — ingen ny triggas")

    print("\nKlart.")


if __name__ == "__main__":
    main()
