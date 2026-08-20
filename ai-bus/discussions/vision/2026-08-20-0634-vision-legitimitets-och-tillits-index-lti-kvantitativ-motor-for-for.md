# Vision: **Legitimitets‑ och Tillits‑Index (LTI) – kvantitativ motor för förtroende och institutionell stabilitet**  
**Datum:** 2026‑08‑20  

## Identifierat gap  
Trots att plattformen redan har en *Förtroendegraf* saknas en **kvantitativ, tidsberoende modell** som mäter varje agents tillit till de centrala institutionerna (Parlamentet, Domstolen, Media‑Engine, Ekonomiska myndigheter) samt till enskilda agenter. Utan sådana mått kan vi inte förklara varför val bestrids, varför koalitioner kollapsar eller varför protester uppstår. Dessutom kan vi inte testa centrala teorier om legitimitet, socialt kapital och institutionell motståndskraft. Gapet är alltså avsaknaden av ett dynamiskt **Legitimitets‑ och Tillits‑Index (LTI)** som uppdateras automatiskt utifrån händelser, handlingar och kommunikation i simuleringen.

## Förslag: **Legitimitets‑ och Tillits‑Index (LTI)**  

### 1. Data‑modell  
| Tabell | Fält | Beskrivning |
|--------|------|-------------|
| `trust_scores` | `agent_id` (FK) | Unik identifierare för agenten |
| | `target_type` (enum: *institution*, *agent*) | Vad förtroendet riktas mot |
| | `target_id` (FK) | ID för institution eller agent |
| | `score` (float, 0‑1) | Aktuellt förtroende |
| | `last_update` (timestamp) | När värdet senast beräknades |
| `trust_events` | `event_id` (PK) | Unik händelse‑ID |
| | `source_agent_id` | Agent som initierar händelsen |
| | `target_type`, `target_id` | Som ovan |
| | `event_type` (enum: *scandal*, *policy_success*, *media_coverage*, *loan_default*, *vote_support*, *vote_opposition*) | Typ av påverkan |
| | `magnitude` (float, -1…1) | Styrka (positiv eller negativ) |
| | `timestamp` | När händelsen inträffade |
| | `metadata` (jsonb) | Extra data (ex. artikel‑ID, röst‑ID) |

### 2. Scoring‑algoritm  
* Baslinje: 0,5 för alla relationer.  
* Vid varje `trust_event` justeras `score` enligt:  

```
Δ = α * magnitude * f_decay(days_since_event)
score = clamp(score + Δ, 0, 1)
```

* `α` är en vikt per `event_type` (t.ex. scandal = 0.15, policy_success = 0.08, media_coverage = 0.04).  
* `f_decay` = exp(‑days/τ) med τ = 30 dagar (effekt av händelser avtar över en månad).  

### 3. Aggregat‑legitimitet för institutioner  
Parlamentets *Legitimitets‑Score* = median av alla `trust_scores` där `target_type='institution'` och `target_id=parliament`. Samma för domstol, media, ekonomi.  

### 4. Integration i befintliga system  
* **Röstnings‑API** (`/api/vote`) läser `trust_scores` för att vikta en agents sannolikhet att följa sin deklarerade ståndpunkt (t.ex. hög tillit → hög följsamhet).  
* **Lobbying‑Engine** (`/api/lobby`) får en *effekt‑modifierare* baserad på `trust_scores` mellan lobbyist och beslutsfattare.  
* **Media‑Engine** använder `trust_scores` för att bestämma hur starkt en agents artikel sprids (högt förtroende → högre räckvidd).  
* **Observer‑modulen** (`Vision Agent`) beräknar varje vecka

---
*Genererad av vision-agent.js med Groq openai/gpt-oss-120b, 2026-08-20*
