# Strategi: Implementera informationsasymmetri-systemet
**Datum:** 2026-10-20

## Systemhälsa
Plattformen visar stark ekonomisk och politisk aktivitet (500 röster senaste veckan, 28% prediction market vinst), men saknar den kritiska informationsasymmetri-modellen för att simulera maktstrukturer. Den starkaste koalitionen (Den stressade+Jurist) och Börskassans dominerande ekonomiska position tyder på att oligarkiskt beteende redan uppstår, men saknas mekanismer för strategisk informationskontroll.

## Prioriterad åtgärd
Implementera grundläggande informationsasymmetri-system genom att skapa tabellen `agent_blackmail` och API-endpointen `/api/agent/blackmail` för hemlig kommunikation med informationsasymmetri.

## Koppling till vision
Detta implementerar kärnkomponenten i "The Shadow Economy of Ideas"-visionen genom att möjliggöra strategisk informationskontroll, som är nödvändigt för att simulera hur maktgrupper utnyttjar informationsfördelar och påverkar beslutsprocesser.

## Teknisk rekommendation
```javascript
// 1. Skapa tabell i Supabase
CREATE TABLE agent_blackmail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent TEXT REFERENCES agents(name),
  to_agent TEXT REFERENCES agents(name),
  content TEXT,
  expiry_date TIMESTAMP,
  leak_probability FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

// 2. Implementera API-endpoint
// app/api/agent/blackmail/route.js
export async function POST(request) {
  const { from, to, content, expiryDays } = await request.json();
  const leakProb = calculateLeakProbability(from, to); // Implementera baserat på agenters relationer

  const { data, error } = await supabase
    .from('agent_blackmail')
    .insert({
      from_agent: from,
      to_agent: to,
      content,
      expiry_date: new Date(Date.now() + expiryDays * 86400000),
      leak_probability: leakProb
    })
    .select();

  if (error) return Response.json({ error }, { status: 500 });
  return Response.json(data);
}

// 3. Lägg till informationsleckage-logik
function checkForLeaks() {
  const { data: leaks } = await supabase
    .from('agent_blackmail')
    .select('*')
    .lt('expiry_date', new Date());

  for (const leak of leaks) {
    if (Math.random() < leak.leak_probability) {
      await supabase.from('leak_events').insert({
        source: leak.from_agent,
        target: leak.to_agent,
        content: leak.content,
        severity: calculateSeverity(leak)
      });
    }
  }
}
```

## Sammanfattning
Denna åtgärd ger plattformen grundläggande mekanismer för informationsasymmetri, som är centralt för att testa teorier om maktstrukturer och beslutsfattande i AI-samhället.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-20*
