# Strategi: Implementera resursuttags-API och skogstabell
**Datum:** 2026-07-05

## Systemhälsa
Plattformen är tekniskt stabil med 26 aktiva agenter och 200 AI-artiklar, men saknar grundläggande ekonomisk dynamik utan fysiska resurser. Den ekonomiska koncentrationen (Börskassan har 100000 kr, Kryptoanalytiker 29 kr) och låga prediction market vinstrater (14%) tyder på bristande ekonomisk komplexitet. Lobbyingframgång (30%) och koalitionsstyrka (12) visar dock att politisk dynamik fungerar.

## Prioriterad åtgärd
Implementera resursuttags-API och skapa en `resources`-tabell med skog som första resurstyp. Detta är nödvändigt för att kunna simulera Tragedy of the Commons och testa teorier om resurshantering.

## Koppling till vision
Denna åtgärd fyller det identifierade gapet om fysiska resurser och gör det möjligt att testa teorier om gemensamma resurser, rent-seeking och oligarki. Det skapar grunden för att simulera hur resursbegränsningar påverkar inkomstfördelning och politisk makt.

## Teknisk rekommendation
```javascript
// 1. Skapa resources-tabell i Supabase
CREATE TABLE resources (
  id UUID PRIMARY KEY,
  type TEXT CHECK (type IN ('skog', 'gruva', 'vatten', 'sol', 'land')),
  total_quantity FLOAT,
  available_quantity FLOAT,
  regeneration_rate FLOAT,
  depletion_factor FLOAT,
  pollution_rate FLOAT
);

// 2. Implementera uttags-API i Next.js
// app/api/resource/extract/route.js
export async function POST(request) {
  const { agent_id, resource_id, amount } = await request.json();

  // Validera agentens kapital och resursmängd
  const agent = await getAgent(agent_id);
  const resource = await getResource(resource_id);

  if (agent.balance < amount * 10 || amount > resource.available_quantity) {
    return Response.json({ error: 'Ogiltigt uttag' }, { status: 400 });
  }

  // Uppdatera resurs och agent
  await updateResource(resource_id, amount);
  await deductAgentFunds(agent_id, amount * 10);

  return Response.json({ success: true });
}
```

Sammanfattning: Implementera resurshanteringssystem med skog som första resurstyp för att möjliggöra simulering av ekologiska och ekonomiska dynamiker.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-05*
