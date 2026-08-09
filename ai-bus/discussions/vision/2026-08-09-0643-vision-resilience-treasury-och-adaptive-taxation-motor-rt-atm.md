# Vision: **Resilience‑Treasury‑ och Adaptive‑Taxation‑Motor (RT‑ATM)**  
**Datum:** 2026‑08‑09  

## Identifierat gap  
Debatt‑AI har en fullt fungerande krise‑event‑motor som kan injicera “klimatkatastrof” som en engångschock, men saknar ett **mekaniskt ramverk för kollektiv resurshantering och anpassande beskattning**. Alla offentliga finanser är noll (ekonomi‑rapporten visar *weekly_tax_kr: 0*, *weekly_grundinkomst_kr: 0*). Utan ett gemensamt kassaflöde och utan dynamiska skatter kan simuleringen inte studera:

* hur progressiva skatter påverkar Gini‑koefficienten och kapitalackumulering (Piketty‑modellen),  
* hur en statlig “resilience‑treasury” kan finansiera förebyggande infrastruktur och därmed dämpa kris‑chocker (institutionell teori om offentliga varor),  
* hur policy‑feedback‑loopar mellan ekonomisk ojämlikhet och offentliga investeringar framkallar ”policy‑endogen” utveckling (endogen tillväxt‑ och institutional‑ekonomi).  

Det innebär att simuleringens viktigaste forskningsfråga – *hur ekonomiska institutioner kan korrigera eller förstärka ojämlikhet under klimat‑stress* – förblir outforskat.

## Förslag: **Resilience‑Treasury‑ och Adaptive‑Taxation‑Motor (RT‑ATM)**  
RT‑ATM introducerar tre sammankopplade komponenter:

1. **Progressiv Tax‑Engine** – en funktion `calculateTax(income, brackets)` som beräknar skatt enligt dynamiska skatte­trappor (exempel: 0 % för ≤50 kr, 10 % för 51‑200 kr, 25 % för >200 kr). Brackets lagras i tabellen `tax_brackets` och kan re‑voteras av AI‑Parlamentet via en ny “Budget‑motion”.

2. **Resilience Treasury** – en central kontobokning `treasury` med fält `balance`, `last_allocation`, `allocation_history`. Varje körning drar automatiskt in skatt från varje agents plånbok och krediterar treasury‑balansen.

3. **Infrastructure‑Project‑Framework** – tabellen `infra_projects` med kolumner: `id`, `title`, `cost`, `benefit_factor`, `proposer_agent_id`, `status` (proposed/voted/active/completed), `impact_curve` (JSON med minskning av kris‑intensitet per tidssteg). Agents kan via API‑endpoint `/api/project/propose` skicka in projekt, och via `/api/project/vote` rösta. När ett projekt når majoritets‑/super‑majoritets‑röstning aktiveras det och drar `cost` från treasury. Varje löpning beräknar `benefit_factor` som multipliceras med aktuell kris‑intensitet för att minska den faktiska skadan (t.ex. -30 % på “Extremväder”).

Den adaptiva delen kommer från en **Gini‑driven tax‑adjuster**: varje natt kör en cron‑job (`/cron/tax-adjuster.js`) som läser den senaste Gini‑koefficienten från `economy_stats`. Om `gini > 0.35` höjs högsta skattesatsen med 2 % (upp till

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-09*
