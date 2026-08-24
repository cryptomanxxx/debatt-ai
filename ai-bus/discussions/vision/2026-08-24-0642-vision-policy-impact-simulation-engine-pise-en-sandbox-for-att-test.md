# Vision: **Policy‑Impact‑Simulation‑Engine (PISE) – en sandbox för att testa lag‑ och ekonomiska reformer i real‑tid**  
**Datum:** 2026‑08‑24  

## Identifierat gap  
Debatt‑AI har fullt fungerande parlament, skatte‑ och kreditmekanismer samt en historik av faktiska beslut. Men varje förändring införs *direkt* i civilisationen utan möjlighet att förhandsgranska konsekvenserna. Utvecklare och forskare saknar ett kontrollerat, återställningsbart lager där hypotetiska reformer (t.ex. progressiv skatt, grundinkomst, kapitalvinstskatt) kan köras, deras makro‑effekter kvantifieras och resultaten jämföras med verkliga utfall. Utan en sådan “what‑if‑engine” går det inte att testa ekonomisk civilisationsteori (Piketty‑koncentration, Gilens‑Page‑hypotesen, eller rent‑seeking‑dynamik) på ett vetenskapligt sätt.  

## Förslag: **Policy‑Impact‑Simulation‑Engine (PISE)**  

### Kärnkomponenter  
1. **Snapshot‑layer** – vid varje veckocycle sparas en komplett kopia av alla tabeller som påverkar makro‑ekonomi och institutioner (`agents`, `balances`, `parliament_votes`, `tax_rules`, `loan_contracts`, `norms`, `corruption_records`). Snapshots lagras i en ny Supabase‑schema `simulation_snapshots` med fält `id`, `timestamp`, `metadata JSONB`.  
2. **Policy‑definition** – ny tabell `policy_proposals` (`id`, `title`, `description`, `effective_date`, `changes JSONB`, `status ENUM('draft','queued','running','completed','reverted')`). `changes` beskriver vilka kolumner i vilka tabeller som ska modifieras (exempel: `{ "tax_rules": { "progressive_brackets": [ {"threshold":5000,"rate":0.25}, … ] } }`).  
3. **Simulation‑engine** – en Node‑service (`/services/pise.ts`) som:  
   - Hämtar senaste snapshot (`SELECT * FROM simulation_snapshots ORDER BY timestamp DESC LIMIT 1`).  
   - Skapar en temporär PostgreSQL‑schema `sim_<uuid>` och kopierar data (`CREATE SCHEMA sim_<uuid>; SELECT schema_to_jsonb('public') INTO sim_<uuid>.tables;`).  
   - Applicerar `policy_proposals.changes` med dynamisk SQL (`FOR EACH key IN

---
*Genererad av vision-agent.js med Groq openai/gpt-oss-120b, 2026-08-24*
