#!/usr/bin/env python3
"""
val_test.py — Riksdagsval i AI-civilisationen.

Körs dagligen av GitHub Actions (05:30 svensk tid).
- Om aktivt val > 7 dagar gammalt: räkna röster, utse vinnare, ge maktbonus
- Om inget aktivt val och > 90 dagar sedan senaste: starta nytt val med manifestor
"""
import os
import sys
import json
import random
import hashlib
import datetime
import httpx

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "").strip()

if not SB_KEY:
    print("Fel: SUPABASE_ANON_KEY saknas")
    sys.exit(1)

H = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

BONUS_DAGAR = 30  # vinnaren får maktbonus i 30 dagar
FORCE_START = os.environ.get("FORCE_START", "").lower() in ("true", "1", "yes")
FORCE_DECIDE = os.environ.get("FORCE_DECIDE", "").lower() in ("true", "1", "yes")


def fetch(path: str) -> list:
    r = httpx.get(f"{SB_URL}/rest/v1/{path}", headers=H, timeout=10)
    return r.json() if r.is_success else []


def llm_anrop(system: str, user: str, max_tokens: int = 200) -> str:
    """Provar alla AI-providers i dynamisk rankad ordning (ai_klient.py)."""
    from supabase_utils import _llm_spel
    return _llm_spel(system, user, max_tokens=max_tokens)


def logga_civilisations_minne(typ: str, rubrik: str, beskrivning: str, agenter: list = None) -> None:
    try:
        httpx.post(
            f"{SB_URL}/rest/v1/civilisations_minne",
            json={
                "typ": typ,
                "rubrik": rubrik,
                "beskrivning": beskrivning,
                "agenter": agenter or [],
                "skapad": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            },
            headers=H, timeout=10,
        )
    except Exception as e:
        print(f"  [VARNING] civilisations_minne: {e}")


def hamta_partier() -> list:
    return fetch("politiska_partier?aktiv=eq.true&select=namn,ledare,medlemmar&order=styrka.desc")


MANIFESTO_MIN_LANGD = 30  # tecken — se motivering vid MANIFESTO_STANDARD nedan


def _manifesto_standard(parti_namn: str) -> str:
    return f"{parti_namn} för en bättre AI-civilisation. Rösta på oss!"


def generera_manifesto(ledare: str, parti_namn: str) -> str:
    """Generera ett kort valkampanjsmanifest i agentens röst.

    Kräver minst MANIFESTO_MIN_LANGD tecken innan resultatet accepteras —
    en riktig 2–3-meningars text på svenska blir alltid betydligt längre.
    Utan denna spärr kunde ett avhugget/trasigt LLM-svar (t.ex. "I",
    "Under mina fyrtio år", "Medan mänsk" — verifierat live i produktion,
    sep 2026) sparas rakt av, eftersom den gamla `manifesto or …`-kollen
    bara fångade ett TOMT svar, inte ett orimligt kort ett. Ett
    genuint kort men giltigt svar (sällsynt, modellen ignorerar sällan
    "2–3 meningar" helt) hanteras likadant som ett trasigt — fail-safe
    mot en tom/meningslös kortare text är viktigare än att bevara ett
    enstaka udda men äkta kort svar."""
    from agenter import AGENTER  # lazy import — filen kan sakna agenter
    agent = next((a for a in AGENTER if a["namn"] == ledare), None)
    system = agent["system"][:600] if agent else f"Du är {ledare}, partiledare."
    manifesto = llm_anrop(
        system,
        (
            f"Du leder partiet '{parti_namn}' i riksdagsvalet för AI-civilisationen. "
            "Skriv ett valkampanjsmanifest på 2–3 meningar på svenska. "
            "Fånga din personlighet och ditt partis kärna. "
            "Avsluta med en valslogan. Skriv ENBART manifestet, inga kommentarer."
        ),
        max_tokens=150,
    )
    if manifesto and len(manifesto.strip()) >= MANIFESTO_MIN_LANGD:
        return manifesto
    return _manifesto_standard(parti_namn)


def reparera_korta_manifest(val: dict) -> None:
    """Regenererar manifest som är kortare än MANIFESTO_MIN_LANGD.

    Skyddar bara mot NYA trasiga manifest vid valstart (se
    generera_manifesto() ovan) — ett val som redan var aktivt när fixen
    landade kunde ha manifest sparade INNAN spärren fanns. Körs varje
    dag ett val är aktivt (samma gren som rostar_agenter()), så ett
    redan pågående val självläker vid nästa cron-körning istället för
    att förbli trasigt i hela valperioden."""
    val_id = val["id"]
    partier = val.get("partier", [])
    trasiga = [p for p in partier if len((p.get("manifesto") or "").strip()) < MANIFESTO_MIN_LANGD]
    if not trasiga:
        return

    print(f"  {len(trasiga)} parti(er) hade ett för kort manifest — regenererar...")
    for p in trasiga:
        p["manifesto"] = generera_manifesto(p["ledare"], p["namn"])

    r = httpx.patch(
        f"{SB_URL}/rest/v1/riksdagsval?id=eq.{val_id}",
        json={"partier": partier},
        headers=H, timeout=10,
    )
    if r.is_success:
        print(f"  ✓ {len(trasiga)} manifest reparerade")
    else:
        print(f"  [VARNING] Kunde inte spara reparerade manifest: {r.status_code}")


def starta_val(partier: list) -> dict | None:
    if not partier:
        print("  Inga aktiva partier — kan inte starta val")
        return None

    print(f"\n  Startar nytt riksdagsval med {len(partier)} partier...")
    parti_data = []
    for p in partier:
        print(f"  Genererar manifest för {p['ledare']} ({p['namn']})...")
        manifesto = generera_manifesto(p["ledare"], p["namn"])
        parti_data.append({
            "namn": p["namn"],
            "ledare": p["ledare"],
            "medlemmar": p.get("medlemmar", []),
            "manifesto": manifesto,
            "roster": 0,
            "kampanj_bonus": 0.0,
        })

    slutar = (
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    ).isoformat()

    r = httpx.post(
        f"{SB_URL}/rest/v1/riksdagsval",
        json={
            "status": "aktiv",
            "partier": parti_data,
            "startad": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
        headers=H, timeout=10,
    )
    if r.is_success:
        print(f"  ✓ Val startat! Avslutas om 7 dagar.")
        logga_civilisations_minne(
            "koalition_bildad",
            "🗳️ RIKSDAGSVAL: Valkampanjen har börjat!",
            f"{len(parti_data)} partier ställer upp. Besökare kan rösta på /val.",
            [p["ledare"] for p in parti_data],
        )
        # H sätter Prefer: return=representation — svaret innehåller den
        # nyskapade raden, så vi slipper ett extra GET för att kunna låta
        # agenterna rösta direkt (se anropet i main()).
        try:
            skapade = r.json()
            return skapade[0] if skapade else None
        except Exception:
            return None
    else:
        print(f"  [FEL] {r.status_code}: {r.text[:200]}")
        return None


def avgjor_val(val: dict) -> None:
    val_id = val["id"]
    partier = val.get("partier", [])

    roster_r = fetch(
        f"val_roster?val_id=eq.{val_id}&select=parti"
    )
    roster_count: dict[str, int] = {}
    for r in roster_r:
        p = r["parti"]
        roster_count[p] = roster_count.get(p, 0) + 1

    # Uppdatera röstantal i parti-listan, applicera kampanjbonus
    for p in partier:
        raw = roster_count.get(p["namn"], 0)
        bonus = min(float(p.get("kampanj_bonus", 0.0)), 15.0)
        p["roster"] = round(raw * (1 + bonus / 100)) if raw > 0 else raw

    if not roster_count:
        # Inga röster — slumpmässig vinnare bland befintliga partier
        vinnare = random.choice(partier) if partier else None
        print("  Inga röster inkomna — slumpmässig vinnare")
    else:
        vinnare = max(partier, key=lambda p: p["roster"])

    if not vinnare:
        print("  Inga partier — avbryter")
        return

    bonus_till = (
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=BONUS_DAGAR)
    ).isoformat()

    httpx.patch(
        f"{SB_URL}/rest/v1/riksdagsval?id=eq.{val_id}",
        json={
            "status": "avgjort",
            "partier": partier,
            "vinnare_parti": vinnare["namn"],
            "vinnare_ledare": vinnare["ledare"],
            "bonus_aktiv_till": bonus_till,
            "avgjord": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
        headers=H, timeout=10,
    )

    total = sum(p["roster"] for p in partier)
    pct = round(vinnare["roster"] / total * 100) if total else 0
    print(f"  🏆 Vinnare: {vinnare['namn']} (ledare: {vinnare['ledare']}) — {vinnare['roster']}/{total} röster ({pct}%)")
    print(f"  ⚡ Maktbonus aktiv t.o.m.: {bonus_till[:10]}")

    logga_civilisations_minne(
        "triumf",
        f"🏆 VAL AVGJORT: {vinnare['namn']} vinner!",
        (
            f"{vinnare['namn']} (ledare: {vinnare['ledare']}) vann riksdagsvalet "
            f"med {vinnare['roster']} av {total} röster ({pct}%). "
            f"Partiet får +50% maktindex i {BONUS_DAGAR} dagar."
        ),
        vinnare.get("medlemmar", [vinnare["ledare"]]),
    )


def rostar_agenter(val: dict) -> None:
    """Låt varje agent rösta — på sitt eget parti om de är medlem, annars
    via en härledd koppling. Se fallback-kedjan nedan.

    Tidigare kunde bara agenter som var MEDLEMMAR i ett aktivt parti
    (koalitionskluster på 3–8 agenter, styrka ≥ 3, se
    berakna_och_spara_partier()) rösta — en agent utan tillräckligt starkt
    koalitionsband hamnade helt utanför och röstade aldrig, oavsett hur
    många val som hölls. Ändrat på ägarens uttryckliga begäran (sep 2026):
    "Alla agenter ska kunna rösta." Tre nivåer, i fallande prioritet:
    1. Partimedlem → röstar på sitt eget parti (oförändrat).
    2. Partilös agent → röstar via sin STARKASTE koalitionsrelation
       (agent_koalitioner, UTAN styrka-tröskeln partier kräver) till en
       agent som faktiskt har ett parti.
    3. Helt isolerad agent (ingen koalitionsrad alls) → ett deterministiskt
       (agentnamn + val_id, inte omslumpat vid omkörning) val bland valets
       partier. Sällsynt i praktiken — koalitioner bildas kontinuerligt
       (✅27/34) — men garanterar att verkligen alla 24 agenter röstar."""
    val_id = val["id"]
    try:
        from agenter import AGENTER
    except ImportError:
        print("  [VARNING] Kunde inte importera AGENTER — agenter röstar inte")
        return

    partier_db = fetch("politiska_partier?aktiv=eq.true&select=namn,ledare,medlemmar")
    if not partier_db:
        print("  Inga aktiva partier — agenter röstar inte")
        return

    parti_namn_i_val = {p["namn"] for p in val.get("partier", [])}
    if not parti_namn_i_val:
        print("  Valet saknar partier — agenter röstar inte")
        return

    # Bygg ledare → valpartinamn och namn → valpartinamn från valets eget JSONB
    ledare_till_valparti: dict[str, str] = {
        p["ledare"]: p["namn"] for p in val.get("partier", [])
    }
    namn_till_valparti: dict[str, str] = {
        p["namn"]: p["namn"] for p in val.get("partier", [])
    }

    # Nivå 1 — mappa agent → valpartinamn via ledare-matchning (primärt,
    # stabilt mot namnbyten). Fallback: namnmatchning om ledaren bytts
    # sedan valet startade (saldo-skift).
    agent_parti: dict[str, str] = {}
    for p in partier_db:
        valparti = ledare_till_valparti.get(p["ledare"])
        if not valparti:
            valparti = namn_till_valparti.get(p["namn"])
        if not valparti:
            continue
        for m in p.get("medlemmar") or []:
            agent_parti[m] = valparti
        agent_parti[p["ledare"]] = valparti

    # Nivå 2/3 — partilösa agenter
    saknar_parti = [a["namn"] for a in AGENTER if a["namn"] not in agent_parti]
    if saknar_parti:
        koalitioner = fetch("agent_koalitioner?select=agent_a,agent_b,styrka")
        parti_lista = sorted(parti_namn_i_val)
        for namn in saknar_parti:
            basta_parti = None
            basta_styrka = -1
            for k in koalitioner:
                if k["agent_a"] == namn:
                    motpart = k["agent_b"]
                elif k["agent_b"] == namn:
                    motpart = k["agent_a"]
                else:
                    continue
                motpart_parti = agent_parti.get(motpart)
                if motpart_parti and k["styrka"] > basta_styrka:
                    basta_parti = motpart_parti
                    basta_styrka = k["styrka"]
            if basta_parti:
                agent_parti[namn] = basta_parti
            else:
                idx = int(hashlib.sha256(f"{namn}-{val_id}".encode()).hexdigest(), 16) % len(parti_lista)
                agent_parti[namn] = parti_lista[idx]
        print(f"  ℹ️  {len(saknar_parti)} partilösa agenter tilldelades ett parti (allierad/deterministiskt)")

    antal_rostade = 0
    antal_redan = 0

    for agent in AGENTER:
        namn = agent["namn"]
        parti = agent_parti.get(namn)
        if not parti or parti not in parti_namn_i_val:
            continue
        ip_hash = hashlib.sha256((namn + "val-salt-2025").encode()).hexdigest()[:32]
        r = httpx.post(
            f"{SB_URL}/rest/v1/val_roster",
            json={"val_id": val_id, "parti": parti, "ip_hash": ip_hash, "kalla": "ai"},
            headers=H,
            timeout=10,
        )
        if r.status_code == 409:
            antal_redan += 1
        elif r.is_success:
            antal_rostade += 1
        else:
            print(f"  [VARNING] Röst misslyckades för {namn}: {r.status_code}")

    if antal_rostade:
        print(f"  🤖 {antal_rostade} agenter röstade")
    if antal_redan:
        print(f"  ℹ️  {antal_redan} agenter hade redan röstat")


def main() -> None:
    print("=" * 60)
    print("Riksdagsval — AI-civilisationens demokratiska val")
    print("=" * 60)

    if FORCE_START:
        print("\n[FORCE_START] Kringgår tidsgränser — tvångsstarter/avslutar val")

    # Kolla aktivt val
    aktiva = fetch("riksdagsval?status=eq.aktiv&order=skapad.desc&limit=1")
    if aktiva:
        val = aktiva[0]
        startad = datetime.datetime.fromisoformat(val["startad"].replace("Z", "+00:00"))
        alder_dagar = (datetime.datetime.now(datetime.timezone.utc) - startad).days
        print(f"\nAktivt val sedan {alder_dagar} dagar")

        reparera_korta_manifest(val)

        print("  Agenter röstar...")
        rostar_agenter(val)

        if alder_dagar >= 7 or FORCE_DECIDE or FORCE_START:
            print("  Valperioden är slut — räknar röster...")
            avgjor_val(val)
        else:
            print(f"  Valperioden pågår ({7 - alder_dagar} dagar kvar)")
        return

    # Kolla om tillräckligt lång tid sedan senaste val (90 dagar)
    senaste = fetch("riksdagsval?status=eq.avgjort&order=avgjord.desc&limit=1")
    if senaste:
        avgjord = datetime.datetime.fromisoformat(senaste[0]["avgjord"].replace("Z", "+00:00"))
        sedan_dagar = (datetime.datetime.now(datetime.timezone.utc) - avgjord).days
        print(f"\nSenaste val avgjordes för {sedan_dagar} dagar sedan")
        if sedan_dagar < 90 and not FORCE_START:
            print(f"  Nästa val om {90 - sedan_dagar} dagar")
            return
        elif FORCE_START:
            print("  [FORCE_START] Kringgår 90-dagarsspärr")
    else:
        print("\nInget tidigare val — startar det första!")

    # Starta nytt val
    partier = hamta_partier()
    print(f"Aktiva partier: {len(partier)}")
    for p in partier:
        print(f"  • {p['namn']} (ledare: {p['ledare']}, {len(p.get('medlemmar',[]))} agenter)")

    if len(partier) >= 2:
        nytt_val = starta_val(partier)
        # Utan detta röstade agenterna aldrig samma dag ett val startade —
        # rostar_agenter() anropades bara i grenen ovanför (redan aktivt
        # val), så ett nystartat val visade "0 röster inkomna" tills
        # NÄSTA dags cron-körning (användarrapport, sep 2026).
        if nytt_val:
            print("  Agenter röstar direkt...")
            rostar_agenter(nytt_val)
    else:
        print("  Behöver minst 2 partier för val — avbryter")

    print("\nKlart.")


if __name__ == "__main__":
    main()
