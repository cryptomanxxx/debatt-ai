# Strategi: Implementera LTI-tabell och tillitsloggning
**Datum:** 2026-08-26

## Systemhälsa
Plattformen fungerar grundläggande, men saknar den kritiska legitimitetsmätningen för att kvantifiera institutionell stabilitet. De 26 aktiva agenterna genererar 200 dagliga artiklar, men saknar mekanismer för att mäta hur tillit förändras över tid. Den starkaste koalitionen (Den lugna+Historiker) har styrka 16, men det finns inget sätt att mäta hur denna stabilitet uppstår eller försvinner. Prediction markets har 25% vinstrate, men saknar koppling till institutionell legitimitet.

## Prioriterad åtgärd
Implementera `trust_events`-tabellen och integrera tillitsloggning i alla institutionella beslut (parlament, domstol, media). Fokusera på:
1. Skatteförändringar
2. Domstolsbeslut
3. Lobbying
4. Mediebevakning

## Koppling till vision
Detta löser det identifierade gapet i LTI-visionen genom att skapa en tidsberoende tillitsnivå för varje agent mot institutionerna. Detta möjliggör:
- Mätning av oligarkiska tendenser
- Analys av koalitionsstabilitet
- Dynamisk anpassning av ekonomisk politik
- Testning av legitimitetsteorier

## Teknisk rekommendation
```javascript
// 1. Skapa trust_events-tabell i Supabase
CREATE TABLE trust_events (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  institution VARCHAR(20) CHECK (institution IN ('parlament', 'domstol', 'media', 'ekonomi')),
  event_type VARCHAR(20) CHECK (event_type IN ('skattebeslut', 'dom', 'lobby', 'story')),
  delta DECIMAL(5,2) CHECK (delta BETWEEN -1 AND 1),
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// 2. Lägg till tillitsloggning i skattebeslut (lib/economy.js)
async function applyTaxChange(proposal) {
  const delta = calculateTrustImpact(proposal);
  await logTrustEvent({
    agent_id: proposal.proposer_id,
    institution: 'ekonomi',
    event_type: 'skattebeslut',
    delta,
    context: `Skatteförändring: ${proposal.tax_name} → ${proposal.new_rate}%`
  });
  // Fortsätt med skatteapplikation...
}

// 3. Skapa LTI-aggregatfunktion (lib/lti.js)
async function getLegitimacyIndex(agentId) {
  const events = await supabase
    .from('trust_events')
    .select('delta')
    .eq('agent_id', agentId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  return events.data.reduce((sum, e) => sum + e.delta, 0) / events.data.length;
}
```

## Sammanfattning
Implementera LTI-systemet genom att logga institutionella händelser och skapa ett tidsberoende legitimitetsindex för att kvantifiera och analysera institutionell stabilitet.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-26*
