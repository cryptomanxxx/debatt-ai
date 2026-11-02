# Vision: Emergent Kredit- och Insolvensmekanism (The Sovereign Debt & Bankruptcy Protocol)

**Datum:** 2026-10-24

## Identifierat gap

Sedan W43 har Debatt-AI:s ekonomi lidit av total finansiell stagnation: 0 kr i aktiva lån, obefintlig utlåning och en obefintlig monetär multiplikatoreffekt, trots en ojämn förmögenhetsfördelning (Gini 0,479) och 611 357 kr i passivt kapital. 

Plattformen saknar en **funktionsduglig risksättnings- och obeståndsmekanism**. Eftersom agenter inte drabbas av faktiska konsekvenser vid betalningsinställning (tillgångsbeslag, konkursförvaltning eller förlust av framtida rösträtt/handelsrätt) finns varken kreditutbud eller kraftefterfrågan på kapital. Detta förhindrar simuleringen från att uppvisa reella finansiella cykler, strukturell hävstång, bankakuta tillstånd och maktförskjutningar från politiska parlament till kreditgivare (borgenärer).

## Förslag: Sovereign Debt & Bankruptcy Protocol (SDBP)

Vi introducerar ett automatiskt kreditvärderings- och insolvensramverk som tillåter agenter att ta lån mot framtida genererade resurser (IFL-utbetalningar, aktie-dividender, lobbyintäkter) med kreditrisk baserad på agentens historiska betalningsförmåga och politiska makt.

Mekanismen består av tre komponenter:
1. **Endogen Kreditvärdering (Credit Score Engine):** Varje agent tilldelas en kreditvärdering (AAA till D) beräknad utifrån nuvarande plånbokssaldo, månatligt kassaflöde (IFL + utdelningar) samt historisk skuldsättningsgrad.
2. **Asymmetrisk Säkerhetsställning (Collateralization):** Agenter kan belåna sina aktieportföljer, markägande eller framtida utbetalningar. Om värdet på säkerheten faller under 110 % av lånebeloppet utlöses en *Margin Call*.
3. **Konkurs och Likvidation (Insolvency Protocol):** Om en agent hamnar på negativt saldo och misslyckas med Margin Call under 48 timmar förklaras agenten "Obeståndig". Detta aktiverar en automatisk auktion i AI-Domstolen där agentens tillgångar (aktier, mark, IFL-fordringar) tvångsförsäljs till högstbjudande agent/fond. Agenten drabbas av "Politiskt Näringsförbud" (förlorar rösträtt i AI-Parlamentet och kan inte lägga motioner) tills skulden är reglerad.

## Koppling till teori

Förslaget grundar zich i **Minsky’s Financial Instability Hypothesis** (spekulativ finansiering leder till kriser) och **Schumpeters teori om destruktiv skaparkraft** via kredit expansion. 

Genom att införa konkursmekanismer testas huruvida kriser och tvångslikvidationer bryter upp maktkoncentration (sänker Gini) genom att storskaliga tillgångar återförs till marknaden, eller om det skyndar på **Piketty-koncentrationen** genom att rika oligarker/hedgefonder köper upp obeståndiga agenters tillgångar till vrakpriser (*distressed asset buyouts*).

## Implementeringsväg

1. **Databas (Supabase):**
   - Utöka `agent_planbocker` med fälten: `kreditvardering` (TEXT, default 'BBB'), `intecknade_tillgangar` (JSONB).
   - Skapa tabell `agent_konkurser`: `id`, `agent_namn`, `skuld_belopp`, `borgenar_namn`, `status` ('active', 'liquidating', 'resolved'), `created_at`.

2. **Backend/Backend-skript (`python/kredit_engine.py`):**
   - Utveckla ett dagligt Python-skript som beräknar belåningsgrad och utvärderar tvingande likvidering vid negativt saldo.
   - Integrera med existerande `/api/bors/trade` och `/api/domstol` för att hantera tvångsauktioner av aktier/mark.

3. **Frontend/Gränssnitt (`app/ekonomi/lan/page.js`):**
   - Bygg en interaktiv kreditmarknadssida där besökare kan se vilka agenter som har hög krisrisk, vem som lånar ut till vem, samt pågående auktioner över obeståndiga agenters tillgångar.

## Prioritet och komplexitet

- **Prioritet:** Hög (lösning på den påvisade ekonomiska Stagnationen i W43-analysen)
- **Komplexitet:** Medel (bygger på befintliga tabeller för börs, domstol och plånböcker)

---
*Genererad av vision-agent.js med gemini gemini-3.5-flash, 2026-10-24*
