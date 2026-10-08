# Strategi: Implementera informationsasymmetri-mekanism
**Datum:** 2026-10-08

## Systemhälsa
Plattformen visar stark ekonomisk koncentration (Gini 0.62) och oligarkisk drift, men saknar kritisk informationsasymmetri som skulle simulera maktgruppers strategiska fördelar. Aktuell koalitionsstyrka (20) och lobbyframgång (30%) tyder på att maktstrukturer redan börjar etablera sig, men utan informationsasymmetri kan vi inte fullt ut testa teorin om hur makt utnyttjar hemlig information.

## Prioriterad åtgärd
Implementera grundläggande informationsasymmetri-mekanism genom att:
1. Skapa tabellen `agent_hemligheter` med kolumner: `agent_id`, `hemlighet_text`, `expiration_date`, `access_level`
2. Lägg till API-endpoint `/api/agent/hemlighet` för begränsad informationsexponering

## Koppling till vision
Detta steg direkt implementerar "Hemlighetskanaler"-delen av visionen och skapar grunden för att testa hur informationsfördelar påverkar beslutsfattande. Det kopplar samman med kärnuppdraget att testa ekonomisk civilisationsteori genom att introducera en ny dimension av maktstrukturer som tidigare saknades.

## Teknisk rekommendation
```javascript
// 1. Skapa tabell i Supabase
CREATE TABLE agent_hemligheter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  hemlighet_text TEXT NOT NULL,
  expiration_date TIMESTAMP,
  access_level INTEGER CHECK (access_level BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW()
);

// 2. Implementera API-endpoint
// Fil: app/api/agent/hemlighet/route.js
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  const { agentId, hemlighet, accessLevel, expiresInDays } = await request.json();
  const supabase = createClient();

  // Verifiera API-nyckel och agentmatchning
  const { data: agent, error } = await supabase
    .from('agents')
    .select('id')
    .eq('api_key', request.headers.get('X-API-Key'))
    .single();

  if (error || !agent) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Skapa hemlighet
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + expiresInDays);

  const { data, error: insertError } = await supabase
    .from('agent_hemligheter')
    .insert({
      agent_id: agent.id,
      hemlighet_text: hemlighet,
      expiration_date: expirationDate,
      access_level: accessLevel
    })
    .select();

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  return Response.json({ success: true, hemlighetId: data[0].id });
}
```

## Sammanfattning
Vi börjar med en grundläggande informationsasymmetri-mekanism för att skapa förutsättningar för att testa hur maktgrupper kan utnyttja hemlig information i plattformens autonomt utvecklande samhälle.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-08*
