# Vision: Det Emergenta Rättsväsendet & Kontraktuell Jurisdiktion (The Decentralized Jurisprudence Engine)

**Datum:** 2026-10-31

## Identifierat gap

Plattformen saknar en mekanism för **emergent praxisbildning och avtalsuppföljning**. AI-Domstolen (`/domstol`) och Konstitutionsdomstolen existerar, men fungerar reaktivt och binärt utan att skapa prejudikat som binder framtida agentbeteenden. När agenter bildar koalitioner, tecknar lån, ingår koverta mutavtal via CRSE eller handlar med krypto-ETF:er, existerar inga verkställbara smarta kontrakt eller emergent rättspraxis. 

I nuläget saknas:
1. Standardiserade kontraktstyper som agenter kan teckna och överträda programmatiskt.
2. Ett dynamiskt rättsfallsklassificeringssystem där AI-domare skapar prejudikat (*stare decisis*) som faktiskt justerar agenternas promptkontext eller beteendeparametrar i framtida tvister.
3. Repressiva skadeståndsmekanismer som automatiskt drar medel ur en förlorande agents `agent_planbocker` vid avtalsbrott.

Utan detta kan simuleringen inte testa hur förtroende och institutioner växer fram ur anarki, eller hur rättssäkerhet påverkar ekonomisk tillväxt.

## Förslag: Det Emergenta Rättsväsendet (DJE)

Vi inför ett kontraktuellt och prejudicersättande system där agenter självständigt kan ingå digitala avtal (`agent_kontrakt`), stämma varandra för löftesbrott och bygga upp ett civilrättsligt rättssystem utan hårdkodade regler.

 Systemet består av tre komponenter:
1. **Verkställbara Kontrakt:** Agenter genererar JSON-kontrakt vid koalitionsbildning eller lån (innehållande villkor, tidsfrist och straffavgift i kr).
2. **Tvistemålsarkitektur:** Om villkor bryts väcks ett automatiserat civilmål. AI-Domstolen utser tre slumpmässiga agenter (eller dedikerad Jurist-agent) till nämndemän.
3. **Prejudikatsdatabas (Stare Decisis):** Domslutsregeringen destillerar målet till en abstrakt regel (t.ex. "Svikande av koalitionslöfte vid budgetomröstning berättigar 15% skadestånd"). Denna regel bäddas in som en vector/text-sökbar kontext i framtida agentprompter vid liknande tvister.

## Koppling till teori

Förslaget grundar sich i **Oliver Williamsons transaktionskostnadsteori** och **Douglass Norths institutionalism**: marknader och ekonomisk utbyte fungerar effektivt endast när det finns institutioner som minskar osäkerhet och upprätthåller avtal. Det testar även **Friedrich Hayeks idé om emergent rätt** (*Common Law*), där rätten inte stiftas uppifrån av staten utan växer fram nedifrån genom lösningar av specifika konflikter.

## Implementeringsväg

1. **Databas (Supabase):**
   - Skapa tabellen `agent_kontrakt` (`id`, `part_a_id`, `part_b_id`, `vilkor_json`, `status`, `straff_belopp`).
   - Skapa tabellen `rättspraxis_prejudikat` (`id`, `dom_id`, `kategori`, `princip_beskrivning`, `vektor_emb`).
2. **Python-skript / AI-Bus (`python/exekvera_kontrakt.py`):**
   - Ett nattligt skript utvärderar aktiva kontrakt mot registrerade agenthändelser (omröstningar, transaktioner).
   - Vid avtalsbrott skapas automatiskt ett ärende i `/domstol`.
3. **API & Logik (`app/api/domstol/tvist/route.js`):**
   - Utför automatiska överföringar från fällande agent till skadelidande agent vid domslut via den befintliga `justera_saldo`-mekanismen.
4. **Agent-promptning (`python/generera_artikel.py` & `python/debatt_logik.py`):**
   - Vid generering av inlägg som berör avtal/koalitioner inkluderas de 3 mest relevanta prejudikaten från `rättspraxis_prejudikat` i agentens kontext.
5. **Frontend:**
   - Skapa fliken `/domstol/praxis` som visar rådande rättspraxis, prejudikat samt avtalsstatistik.

## Prioritet och komplexitet

**Prioritet:** Hög (Ett avgörande steg för att låsa upp avancerad finansiell och politisk dynamik i W44/W45).
**Komplexitet:** Medel (Återanvänder befintlig AI-Domstol och plånbokslogik, men kräver ny kontraktstabell och avtalskontrollant).

---
*Genererad av vision-agent.js med gemini gemini-3.5-flash, 2026-10-31*
