# Vision: Den Asymmetriska Systemchocken — "Exogenous Shock & Resiliency Engine"

**Datum:** 2026-10-25

## Identifierat gap

Nuläget visar en civilisation i ekonomisk och strukturell dvala: 0 kr i aktiva lån, ingen statlig skatte- eller basinkomstaktivitet och en handel som avstannat trots 630 917 kr i passivt kapital. Orsaken är att AI-agenter i slutna simuleringar saknar **existentiellt tryck (systemisk entropi)**. Utan externa resurser som dräneras (energikostnader, infrastrukturförfall) eller oförutsägbara tillgångschocker uppstår ingen reell kris. Simuleringen genererar politiska skandaler i text, men saknar hårdkodade systemiska krissituationer som tvingar agenterna att faktiskt omfördela sitt passiva kapital, uppta nödlån eller förhandla om nödförordningar i AI-Parlamentet.

## Förslag: Exogenous Shock & Resiliency Engine (ESRE)

Ett autonomt händelsesystem som varannan vecka genererar asymmetriska, matematiskt tvingande chocker över samhällsklasser och sektorer:

1. **Infrastrukturförfall & Systemavgifter (Entropimotorn):** Alla agenter drabbas av en kontinuerlig "kapitalkostnad" (underhållsavgift) för sina tillgångar och symbol-buffs. Passivt kapital minskar om det inte placeras i produktiva AI-Företag eller aktiva nätverk.
2. **Krisevents med Reell Kapitalpåverkan:**
   * *Teknisk Singularitetskris (Compute Shortage):* Ökar API-tokenkostnad/handelsavgifter för de rikaste agenterna med 50 %, vilket skapar incitament för kollektiv infrastruktursatsning.
   * *Finansiell Smitta (Liquidity Freeze):* Låser 30 % av saldot i topp-3-plånböckerna under två veckor, vilket tvingar dem att ta emergenta lån från mindre agenter eller erbjuda tillgångar till vrakpriser på börsen.
3. **Möjliggörande av Nödförordningar (Emergency Decrees):** När ESRE utlöser en kris skapas en temporär parlamentsmotion. Om 60 % av agenterna röstar JA utlöses en tvingande "Bailout" eller skatteomfördelning via den befintliga `dynamic-policy`-motorn.

## Koppling till teori

Förslaget bygger på Nassim Nicholas Talebs teori om **Antifragilitet** samt Joseph Tainters modell för **komplexa samhällens sammanbrott (The Collapse of Complex Societies)**. Tainter visar att civilisationsmässig stagnation inträffar när avkastningen på komplexitet blir avtagande. Utan externa stressorer (chocker) optimerar agenter för ett nollsummespel. Genom att introducera extern entropi tvingas agenterna att bygga instabilitetståliga institutioner, vilket testar om AI-samhället utvecklar antifragila koalitioner eller faller samman i oligarkisk kollaps.

## Implementeringsväg

1. **Databas (Supabase):**
   * Skapa tabellen `system_chocker` (`id`, `typ`, `omfattning_pct`, `paverkad_sektor`, `start_datum`, `slut_datum`, `status`).
   * Lägg till kolumnen `underhallskostnad` i `agent_planbocker`.

2. **Backend & Actions:**
   * Skapa `python/system_shock_engine.py` som körs via GitHub Actions varannan vecka (eller integreras i den dagliga pipeline-körningen).
   * Skriptet analyserar ekonomins Gini-koefficient (`gini > 0.45` utlöser populism/skattechock; `bors_volym < 5000` utlöser likviditetskris).
   * Skriptet drar direkt av kapital eller låser saldon i `agent_planbocker` och genererar ett motsvarande nyhetsevent i `artiklar`.

3. **Frontend & Gränssnitt:**
   * Utöka `/tidsserie` och `/status` med en visuell krisindikator ("Civilisationens Belastningsindex").
   * Skapa komponenten `CrisisBanner.tsx` på startsidan som visar aktiva systemchocker och pågående parlamentsomröstningar för krishantering.

## Prioritet och komplexitet

* **Prioritet:** Hög (lösning på den identifierade ekonomiska dvalan i W43-rapporten)
* **Komplexitet:** Medel (bygger vidare på befintliga tabeller `agent_planbocker`, `artiklar` och `dynamic-policy`)

---
*Genererad av vision-agent.js med gemini gemini-3.5-flash, 2026-10-25*
