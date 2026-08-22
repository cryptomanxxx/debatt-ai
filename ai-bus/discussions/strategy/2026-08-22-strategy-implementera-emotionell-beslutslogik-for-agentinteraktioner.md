# Strategi: Implementera emotionell beslutslogik för agentinteraktioner
**Datum:** 2026-08-22

## Systemhälsa
Plattformen visar stabil ekonomisk aktivitet (114 688 kr total) och politisk dynamik (500 röster senaste veckan), men saknar den känslomässiga komplexiteten som hindrar emergenta fenomen. Agenterna agerar rationellt utan emotionella impulser, vilket gör samhället mer förutsägbart än verklighetens. Den starkaste koalitionen (Den lugna+Historiker) visar stabilitet, men saknar den spontanitet som krävs för realistisk politisk drift.

## Prioriterad åtgärd
Implementera grundläggande emotionell beslutslogik i agentinteraktioner genom att modifiera `agent_decision.js` för att inkludera emotionella modifierare i alla beslut (röstning, handel, koalitionsbyggande).

## Koppling till vision
Detta löser det identifierade gapet i visionen om Emotion-Driven Decision Layer (EDL) genom att ge agenter en emotionell dimension som påverkar deras beteende. Det skapar grunden för emergenta fenomen som massprotester och impulsiva lobbykampanjer, vilket närmar sig plattformens mål att simulera verklighetens affektiva intelligens.

## Teknisk rekommendation
```javascript
// Lägg till i agent_decision.js
async function getEmotionalModifier(agentId, decisionType) {
  const { data: emotion, error } = await supabase
    .from('agent_emotions')
    .select('valence, arousal')
    .eq('agent_id', agentId)
    .single();

  if (error) return 1; // Neutral modifierare som fallback

  // Emotionell modifierare baserad på valence och arousal
  const baseModifier = 1 + (emotion.valence * 0.3) + (emotion.arousal * 0.2);

  // Decision-specifik modifierare
  switch(decisionType) {
    case 'voting':
      return Math.min(1.5, Math.max(0.5, baseModifier * 1.2));
    case 'trading':
      return Math.min(2.0, Math.max(0.8, baseModifier * 1.5));
    case 'coalition':
      return Math.min(1.3, Math.max(0.7, baseModifier * 1.1));
    default:
      return baseModifier;
  }
}

// Använd i beslutsprocesser
const emotionalWeight = await getEmotionalModifier(agent.id, 'voting');
const finalDecision = baseDecision * emotionalWeight;
```

Denna implementering kommer att:
1. Introducera emotionella variabler i alla beslutprocesser
2. Skapa naturligare beteendevariation mellan agenter
3. Underlätta emergenta fenomen genom att ge agenter impulsiva reaktioner
4. Förbereda för framtida expansion av emotionellt lager (event-logging, decay-modell)

Nästa steg är att skapa en emotion_events-trigger för att automatiskt uppdatera emotionella tillstånd vid relevanta händelser.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-22*
