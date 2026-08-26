# Vision: **Legitimitets‑ och Tillits‑Index (LTI) – kvantitativ motor för institutionell stabilitet**  
**Datum:** 2026‑08‑26  

## Identifierat gap  
Debatt‑AI har en statisk *Förtroendegraf* som bara markerar om en agent har en positiv, negativ eller neutral relation till en annan agent. Den saknar två kritiska dimensioner:  

1. **Tidsberoende tillitsnivåer** – hur tidigare händelser (skatteförändringar, domstolsbeslut, korruption, lobby‑påverkan) förändrar varje agents förtroende för de centrala institutionerna (Parlamentet, Domstolen, Media‑Engine, Ekonomiska myndigheter).  
2. **System‑wide legitimitetsmätning** – ett aggregerat mått som kan jämföras över tid och som styr dynamiken i val, koalitionsbildning och ekonomiska beslut.  

Utan ett sådant index kan vi inte kvantifiera varför oligarkiska tendenser accelererar, varför koalitioner kollapsar eller varför vissa reformer ignoreras av majoriteten. Detta hindrar både empirisk testning av legitimitetsteorier och automatisk anpassning av spelmekaniken för att hålla civilisationen i ett kritiskt men stabilt område.

## Förslag: **Legitimitets‑ och Tillits‑Index (LTI) Engine**  
### Kärnkomponenter  
| Komponent | Beskrivning | Teknisk detalj |
|-----------|--------------|----------------|
| **trust_events** (tabell) | Loggar varje händelse som potentiellt påverkar tilliten: skatt‑/utgiftspaket, domstolsdom, muta‑offert, media‑story, koalitionsbrott. | `id PK`, `agent_id FK`, `institution ENUM('parlament','domstol','media','ekonomi')`, `event_type VARCHAR`, `impact_score FLOAT` (‑1 – +1), `timestamp`. |
| **trust_scores** (tabell) | Aggregerat tillitsvärde per agent och institution, beräknat som exponentiellt avklingande glidande medelvärde av `trust_events`. | `agent_id PK`, `institution PK`, `score FLOAT` (0‑1), `last_update TIMESTAMP`. |
| **LTI‑calc‑job** (cron) | Daglig bakgrundsprocess som läser nya `trust_events`, uppdaterar `trust_scores` och beräknar ett **system‑wide LTI** = viktat medelvärde av alla agents institution‑score med vikter baserade på agentens ekonomiska makt (wealth). | Node‑script `ltiCalc.js` i `jobs/`, använder Supabase RPC `calc_lti()` för batch‑beräkning. |
| **API‑endpoints** | `GET /api/trust/:agentId` – returnerar agentens trust‑profil. `POST /api/trust/event` – registrerar händelse (anropas automatiskt av befintliga moduler via webhook). `GET /api/lti` – returnerar system‑wide index och historik. | Lägg till i `pages/api/trust/`

---
*Genererad av vision-agent.js med Groq openai/gpt-oss-120b, 2026-08-26*
