# Vision: **Legitimitets‑ och Tillits‑Index (LTI) – kvantitativ motor för institutionell stabilitet**  
**Datum:** 2026‑08‑23  

## Identifierat gap  
Debatt‑AI har en statisk *Förtroendegraf* som bara visar om en agent har en positiv, negativ eller neutral relation till en annan. Den fångar inte hur starkt varje agent litar på de centrala institutionerna (Parlamentet, Domstolen, Media‑Engine, Ekonomiska myndigheter) eller hur förtroendet förändras över tid. Utan ett tidsberoende, händelse‑drivet mått kan vi inte förklara varför val bestrids, varför koalitioner kollapsar eller varför oligarkiska tendenser accelererar. Detta hindrar både empirisk testning av legitimitetsteorier och dynamisk styrning av spelet.

## Förslag: **Legitimitets‑ och Tillits‑Index (LTI) Engine**  
En modul som beräknar ett numeriskt LTI‑värde (0–100) för varje agent och för varje institution. LTI uppdateras automatiskt varje timme genom att inkorporera:

| Händelsetyp | Källtabell | Påverkan (vikt) | Formel (exempel) |
|-------------|------------|----------------|------------------|
| **Röstning** | `votes` | +2 per giltig röst på institutionell proposition | `Δ = +2 * (vote.proposition.institution == target)` |
| **Lagstiftning** | `parliament_propositions` | +5 om lagen antas utan protest, –5 vid stark motstånd | `Δ = ±5 * sign(passed) * protest_intensity` |
| **Korruption** | `bribe_offers` (CRSE) | –10 per bekräftad muta mot institutionen | `Δ = -10 * bribe.amount/100` |
| **Medieexponering** | `news_items` | +1 per positiv artikel, –1 per negativ | `Δ = Σ sentiment_score` |
| **Protester / Tull** | `crisis_events` | –3 per protest riktad mot institutionen | `Δ = -3 * participants/10` |
| **Ekonomisk påverkan** | `transactions` | +0.5 per transaktion som gynnar institutionens budget | `Δ = +0.5 * (tx.to == institution)` |

LTI‑värdet beräknas som en exponentiell glidande medelvärde:  

```
LTI_t = α * LTI_{t‑1} + (1‑α) * ΣΔ_event
```
där α = 0.85 (behåller historik men låter nya händelser dominera).  

Resultatet lagras i tabellen `lti_scores` och exponeras via API‑endpoints:

* `GET /api/lti/agent/:id` → `{agent_id, lti_overall, lti_by_institution:{parliament:…, court:…, media:…, econ:…}}`
* `GET /api/lti/summary` → aggregerad fördelning, trend‑graf, Gini‑fördelning av LTI.  

Frontend‑komponenten `components/LTIChart.jsx` visar varje agents LTI‑kurva i real‑tid och färglägger koalitioner som “stable” (>70) eller “fragile” (<30).

## Koppling till teori  
1. **Institutionell legitimitet (Suchman, 1995)** – LTI operationaliserar *pragmatisk*, *moral* och *kognitiv* legitimitet i en kvantitativ skala.  
2. **Socialt kapital (Putnam, 2000)** – LTI korrelerar med nätverksdensitet i förtroendegrafen; hög LTI → högt socialt kapital → fler koalitioner.  
3. **Gilens‑Page‑hypotesen** – Genom att jämföra LTI‑gapet mellan ekonomiskt mäktiga agenter och genomsnittet kan vi mäta om ”r

---
*Genererad av vision-agent.js med Groq openai/gpt-oss-120b, 2026-08-23*
