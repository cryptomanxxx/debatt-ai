# Strategi: Implementera EDDE-kärnan i beslutsmekanismen
**Datum:** 2026-08-06

## Systemhälsa
Plattformen fungerar tekniskt sett bra, men saknar den känslomässiga dimension som är central för EDDE-visionen. Ekonomin är stabil (114517 kr total), koalitionerna är aktiva (Den stressade+Historiker styrka 14), och prediction markets fungerar (32% vinstrate). Däremot saknas dynamiska humörsvängningar som skulle göra beslutsprocesserna mer realistiska och komplexa.

## Prioriterad åtgärd
Implementera grundstrukturen för EDDE (Emotion-Driven Decision Engine) i agentbeslutsmekanismen. Fokusera på:
1. Emotion-state-schema per agent (valence/arousal)
2. Event-trigger-system för kriser/policyändringar
3. Humörbaserade modifierare på utility-funktioner

## Koppling till vision
EDDE är direkt kopplat till kärnuppdraget att simulera realistiska samhällsprocesser. Det fyller gapet för känslomässiga mekanismer som driver verkliga politiska och ekonomiska beslut. Genom att införa dynamiska humörsvariabler kan vi testa teorier om hur kollektiva känslostater påverkar institutionell stabilitet och policyadaption.

## Teknisk rekommendation
```javascript
// Lägg till i agent-schema (Supabase-tabellen)
ALTER TABLE agents ADD COLUMN emotion_state JSONB;
-- Exempelvärde: {"valence": 0.3, "arousal": -0.2}

// Skapa emotion-engine.js
function updateEmotionState(agentId, eventType) {
  const impactMatrix = {
    'bankrun': { valence: -0.8, arousal: 0.9 },
    'policy_change': { valence: 0.5, arousal: 0.3 }
  };

  const baseState = await db.getEmotionState(agentId);
  const eventImpact = impactMatrix[eventType] || { valence: 0, arousal: 0 };

  // Decay + event impact
  const newState = {
    valence: Math.max(-1, Math.min(1, baseState.valence * 0.9 + eventImpact.valence)),
    arousal: Math.max(-1, Math.min(1, baseState.arousal * 0.9 + eventImpact.arousal))
  };

  await db.updateEmotionState(agentId, newState);
  return newState;
}

// Modifiera utility-funktioner
function calculateDecisionUtility(agentId, option) {
  const emotionState = await db.getEmotionState(agentId);
  const baseUtility = calculateBaseUtility(option);

  // Humörbaserade modifierare
  const valenceModifier = emotionState.valence > 0 ? 1.2 : 0.8;
  const arousalModifier = emotionState.arousal > 0 ? 1.5 : 0.7;

  return baseUtility * valenceModifier * arousalModifier;
}
```

Implementera först grundstrukturen i emotion-engine.js, sedan integrera med befintliga beslutsmekanismer. Test med artificiella kriser för att verifiera att humörsvängningar påverkar beslut.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-06*
