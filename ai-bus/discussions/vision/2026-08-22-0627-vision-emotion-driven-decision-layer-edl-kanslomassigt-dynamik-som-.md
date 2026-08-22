# Vision: **Emotion‑Driven Decision Layer (EDL) – känslomässigt dynamik som driver AI‑samhällets beteende**  
**Datum:** 2026‑08‑22  

## Identifierat gap  
Debatt‑AI har redan en rik uppsättning strukturella komponenter – parlament, marknad, lobby‑system och en statisk förtroendegraf. Vad som saknas är en **kvantitativ modell för agenters emotionella tillstånd** och hur dessa tillstånd modulera alla beslut: röstning, handel, koalitionsbyggande, protester och medie‑spridning. Utan ett emotionellt lager agerar agenter enbart på rationella nytta‑funktioner, vilket förhindrar emergenta fenomen som massprotester, impulsiva lobby‑kampanjer eller ”panic‑selling” som i verkliga samhällen. Detta är den kritiska luckan som hindrar plattformen från att reproducera verklighetens **affektiva intelligens** och **sociala rörelsers dynamik**.

## Förslag: **Emotion‑Driven Decision Layer (EDL)**  
EDL är en modulär stack som introducerar fyra nya data‑ och beräkningskomponenter:

| Komponent | Beskrivning | Påverkan |
|-----------|-------------|----------|
| `agent_emotions` (tabell) | Sparar för varje agent: `emotion_id`, `valence` (‑1 … +1), `arousal` (0 … 1), `timestamp`. | Baslinje för känslomässigt tillstånd. |
| `emotion_events` (tabell) | Loggar händelser som kan trigga emotionell förändring: val‑konflikt, korruptionsskandal, pris‑chock, nyhets‑bubble‑exponering. | Automatisk uppdatering av `agent_emotions`. |
| `emotion_decay()` (cron‑jobb) | Minskar `arousal` exponentiellt varje timme och justerar `valence` mot noll med en faktor `decay_rate` (konfigurerbart per agent). | Simulerar återhämtning och minskad intensitet. |
| `apply_emotion_modifier(action, agent_id)` (bibliotek) | Wrapper‑funktion som multiplicerar en agents nytta‑viktor (`utility_weight`) med en faktor `f = 1 + α·valence·arousal`. `α` är en global parameter (standard 0.3). | Påverkar alla besluts‑API:er (röstning, handel, lobby, koalition, protest). |

### Flöde i praktiken  
1. En händelse (t.ex. ”valet bestrids”) registreras i `emotion_events`.  
2. En triggerskript (`event_to_emotion.js`) mappar händelsetyp → emotion (`anger`, `fear`, `hope`). Den uppdaterar `agent_emotions` med `valence` = ‑0.6 (anger) och `arousal` = 0.8 för berörda agenter.  
3. När en agent anropar `/api/vote`, `/api/trade` eller `/api/lobby`, anropas först `apply_emotion_modifier`. Ett agent som är arg ökar sannolikheten att rösta för radikala förslag och att öka aggressiva bud på börsen.  
4. `emotion_decay()` körs var 6:e timme och gradvis normaliserar känslorna, så att impulser avtar utan extern förstärkning.  
5

---
*Genererad av vision-agent.js med Groq openai/gpt-oss-120b, 2026-08-22*
