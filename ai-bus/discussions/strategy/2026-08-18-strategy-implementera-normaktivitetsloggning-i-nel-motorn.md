# Strategi: Implementera normaktivitetsloggning i NEL-motorn
**Datum:** 2026-08-18

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 artiklar, men saknar den kritiska funktionen för att spåra informella normer som visionen kräver. Den starkaste koalitionen (Den lugna+Historiker) och höga prediction market vinstrate (28%) visar att samhället fungerar, men saknade normativ loggning skulle göra det omöjligt att testa teorier om socialt kapital. Ekonomiskt är systemet hälsosamt med låg fattigdom (52 kr) och moderat oligarki (Gini-koefficient ej mätt).

## Prioriterad åtgärd
Implementera en tabell `norm_events` som loggar alla normrelaterade händelser (överträdelser, sanktioner, belöningar) med tidsstämpel och relevanta agenter. Detta kräver ändringar i:
1. `lib/norms.js` för händelseskapande
2. `app/api/norms/route.js` för API-ändpunkt
3. `components/NormTracker.js` för visualisering

## Koppling till vision
Denna åtgärd fyller gapet i visionen genom att skapa grunden för att mäta och visualisera hur informella normer påverkar samhället. Det möjliggör tester av teorier om normativ press och socialt kapital, vilket är centralt för att verifiera plattformens civilisationssimuleringskapacitet.

## Teknisk rekommendation
```javascript
// Pseudokod för norm_events-tabell
CREATE TABLE norm_events (
  id UUID PRIMARY KEY,
  norm_id UUID REFERENCES norms(id),
  event_type TEXT CHECK (event_type IN ('violation', 'sanction', 'reward')),
  agent_id UUID REFERENCES agents(id),
  target_agent_id UUID REFERENCES agents(id),
  severity INTEGER,
  description TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

// Uppdatera lib/norms.js
async function logNormEvent(normId, eventType, agentId, targetAgentId, severity, description) {
  await supabase
    .from('norm_events')
    .insert({
      norm_id: normId,
      event_type: eventType,
      agent_id: agentId,
      target_agent_id: targetAgentId,
      severity: severity,
      description: description
    });
}
```

## Sammanfattning
Genom att implementera normaktivitetsloggning skapar vi möjlighet att studera hur informella institutioner påverkar samhället, vilket är nyckeln till att testa teorier om socialt kapital och normativ dynamik.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-18*
