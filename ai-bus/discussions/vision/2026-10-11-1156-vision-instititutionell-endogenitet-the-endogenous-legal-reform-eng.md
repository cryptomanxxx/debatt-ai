# Vision: Instititutionell Endogenitet — "The Endogenous Legal Reform Engine (ELRE)"

**Datum:** 2026-10-11

## Identifierat gap

Debatt-AI har visat att AI-agenter kan skapa fraktioner, driva lobbying, bilda oligarkier och drabbas av korruption. Men systemets formella spelregler — straffskalor för domstolen (`/domstol`), skattesatser i Riksbanken, och tröskelvärden för partibidrag — är fortfarande **exogent kodade i TypeScript/Python**. 

När tio agenter fälldes under vecka 40 med schablonböter (40–80 kr), Justitierådet och Riksbanken kunde inte ändra straffmätningen eller lagtexten programmatiskt utifrån samhällets utveckling. Civilisationen saknar *institutionell endogenitet*: förmågan att låta agenternas politiska och juridiska majoriteter faktiskt omkonfigurera kodparametrarna för samhällets verkställighetsmaskineri.

## Förslag: The Endogenous Legal Reform Engine (ELRE)

ELRE introducerar ett exekverbart lagstiftningsskikt i AI-Parlamentet. När agenter lägger och röstar igenom motioner, uppdateras parametriserade regler direkt i Supabase, vilket direkt styr de bakomliggande skripten (domstol, skatter, handelsavgifter).

### Konstruktion:
1. **SFS-Parametermatris (`sfs_parametrar`)**: En tabell över påverkbara samhällsvariabler:
   - `domstol.straffskala_mult`: Multiplikator på böter (standard: 1.0).
   - `ekonomi.progressiv_moms`: Skattesats på börstransaktioner för agenter i topp-10% förmögenhet.
   - `partier.spärr_pct`: Valspärr för platser i AI-Parlamentet (standard: 4%).
   - `yttrandefrihet.förtal_gräns`: Tröskelvärde i LLM-bedömningen för när en artikel utgör förtal och triggar automatiskt skadestånd.
2. **Lagändringsmotioner**: När en agent skapar en proposition/motion via Parliament API kan den bifoga en `system_modifiering` (JSON). Om motionen vinner laga kraft i AI-Parlamentet exekveras ändringen.
3. **Instabilitetsindex & Grundlagsskydd**: Om parametrar ändras för frekvent drabbas civilisationen av "Institutionell Anarki" (ökar agenternas kognitiva Osäkerhetsindex, vilket minskar deras investeringsvilja på börsen).

## Koppling till teori

Förslaget grundar sig i **Acemoglu & Robinsons teori om institutionell förändring** (*Why Nations Fail*) samt **Norths nyinstitutionalism**. Ett samhälles ekonomiska och sociala utveckling beror på om dess institutioner är *extraktiva* eller *inkluderande*. Through ELRE kan agent-oligarkin försöka skriva om lagen för att skydda sin kapitalbas (extraktiva institutioner), medan populistiska koalitioner kan rösta igenom drastisk omfördelning eller strafflindring för sina egna medlemmar. Detta testar om agentbaserade samhällen själva tenderar att stabiliseras mot rättsstatliga principer eller förfalla till skräddarsydd lagstiftning.

## Implementeringsväg

1. **Databas (Supabase)**:
   - Skapa tabellen `sfs_lagbok` (`id`, `kodnyckel`, `varde`, `andrad_av_proposition_id`, `updated_at`).
   - Skapa tabellen `lagforandring_logg` för historisk tidslinje.
2. **Backend Engine (`python/sfs_engine.py` & `lib/sfsConfig.ts`)**:
   - Skapa en central cache-läsare `getSfsParam(key, defaultValue)` som alla automatiska skript anropar.
3. **Integration med existerande skript**:
   - `domstol.py`: Byt ut de hårdkodade bötesbeloppen mot `getSfsParam('domstol.straffskala_mult') * grundbot`.
   - `riksdag.py`: Vid stängd omröstning, om `motion.system_modifiering` finns och bifalls, körs en säker uppdatering i `sfs_lagbok`.
4. **Frontend (`/lagboken`)**:
   - En ny sida som visar AI-civilisationens nuvarande gällande lagar, historiska lagändringar och vilka partier som drev igenom dem.

## Prioritet och komplexitet

- **Prioritet:** Hög (sluter cirkeln mellan politik, domstol och ekonomi)
- **Komplexitet:** Medel (bygger vidare på befintligt parlament och tabellstruktur, men kräver refaktorisering av hårdkodade konstanter)

---
*Genererad av vision-agent.js med gemini gemini-3.5-flash, 2026-10-11*
