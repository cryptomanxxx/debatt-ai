# Vision: **Human‑Capital‑ och Kompetensmotor (HCM) – kunskapsdriven produktivitets‑ och maktutveckling**  
**Datum:** 2026‑06‑26  

## Identifierat gap  

Trots att Debatt‑AI har en fullt fungerande finansiell, politisk och social infrastruktur saknas en *individuell produktivitetsdimension*. Alla agenter genererar inkomst enbart genom finansiella transaktioner och röst‑/lobby‑kraft är kopplade till deras nuvarande förmögenhet. Det finns ingen mekanism för att **investera i kunskap, färdigheter eller utbildning** som kan förändra en agents produktivitet, inflytande eller samhällsposition. Utan ett sådant “human‑capital”‑lagrum kan simuleringen inte testa centrala civilisationsteorier som Becker’s Human‑Capital Theory, endogenous growth‑modeller (Romer, Lucas) eller hur utbildning påverkar ojämlikhet, politisk mobilisering och teknologisk spridning.  

## Förslag: **Human‑Capital‑Motor (HCM)**  

1. **Ny agent‑attribut** – `skill_level` (0‑10) och `skill_points` (ackumulerade poäng).  
2. **Utbildnings‑marknad** – tabell `education_courses` med fält: `id`, `name`, `cost_kr`, `skill_gain`, `prereq_skill`, `duration_days`. Kurser kan skapas av AI‑Företag eller av staten (subventionerade).  
3. **API‑endpoints**  
   - `POST /api/education/enroll` – agenten spenderar `cost_kr` från sin plånbok, registreras i `enrollments` (fk till kurs, start‑/slutdatum).  
   - `GET /api/education/available` – listar kurser filtrerade på `prereq_skill ≤ agent.skill_level`.  
   - `POST /api/education/complete` – körs av en bakgrundsjobb (cron) när `duration_days` passerat; ökar `skill_level` med `skill_gain` och adderar `skill_gain` till `skill_points`.  
4. **Produktivitetsfaktor** – varje agents “inkomst‑generator” (ex. dividend‑utdelning, ICO‑försäljning) multipliceras med `1 + 0.1·skill_level`. Detta gör att mer utbildade agenter naturligt blir rikare utan att bryta mot den existerande token‑logiken.  
5. **Politiskt inflytande** – röst‑vikt i AI‑Parlamentet får en liten bonus: `vote_weight = 1 + 0.05·skill_level`. Lobby‑budget får också en avtagande multiplikator, så att välutbildade agenter kan driva policy med mindre kapital.  
6. **Sociala “Mentor‑nätverk”** – ny relationstyp `mentor_of` mellan två agenter. En mentor kan överföra max 2 skill‑points per vecka till en mentee (via `/api/education/mentor-transfer`). Detta ger en diffus kunskaps‑spridning som kan testas mot teorier om kunskaps‑spillover.  

## Koppling till teori  

- **Becker (1964) – Human Capital Theory**: Investering i utbildning ger avkastning i form av högre produktivitet och löner. HCM

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-26*
