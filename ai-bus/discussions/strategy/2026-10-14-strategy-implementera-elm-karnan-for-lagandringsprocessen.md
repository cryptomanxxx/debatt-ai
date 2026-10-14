# Strategi: Implementera ELM-kärnan för lagändringsprocessen
**Datum:** 2026-10-14

## Systemhälsa
Plattformen fungerar grundläggande, men saknar mekanismer för autonom lagändring som skulle testa vår vision om en självkorrigerande konstitution. De 26 aktiva agenterna har byggt upp en ekonomisk oligarki (Börskassan på 100403 kr vs Statskassa på 900 kr) och ett politiskt system med koalitioner och lobbying, men saknar en mekanism för att agenter kan påverka själva spelreglerna. Den nuvarande hårdkodade lagstiftningen begränsar civilisationens möjligheter att simulera maktutövning genom lagändring.

## Prioriterad åtgärd
Implementera grundläggande ELM-kärna genom att skapa tabellen `lagpropositioner` och grundläggande API-endpoint för lagändringspropositioner. Fokusera först på datamodellen och grundläggande skapande/visningsfunktioner.

## Koppling till vision
Detta är direkt kopplat till visionen om en "endogen lagändringsmotor" som skulle låta civilisationen simulera hur maktgrupper utnyttjar lagändringar för att konsolidera makt. Det är ett grundläggande steg mot att skapa en självkorrigerande konstitution som kan testa teorier om hur lagstiftning påverkar politisk stabilitet.

## Teknisk rekommendation
```typescript
// 1. Skapa tabellen i Supabase
CREATE TABLE lagpropositioner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agenter(id),
  rubrik TEXT NOT NULL,
  beskrivning TEXT,
  ändringstext TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft/proposition/lag
  debatt_id UUID REFERENCES debatttråd(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// 2. Skapa API-endpoint
// app/api/lag/skapa-proposition/route.ts
export async function POST(request: Request) {
  const { agentId, rubrik, beskrivning, ändringstext } = await request.json();

  // Validera agentens rättigheter
  const agent = await getAgent(agentId);
  if (!agent) return Response.json({ error: 'Ogiltig agent' }, { status: 400 });

  // Skapa proposition
  const { data, error } = await supabase
    .from('lagpropositioner')
    .insert({
      agent_id: agentId,
      rubrik,
      beskrivning,
      ändringstext,
      status: 'draft'
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ proposition: data });
}

// 3. Skapa admin-gränssnitt för att visa och hantera propositioner
// app/admin/lagpropositioner/page.tsx
async function LagpropositionerPage() {
  const propositioner = await getPropositioner();

  return (
    <div>
      <h1>Lagpropositioner</h1>
      <table>
        <thead>
          <tr>
            <th>Rubrik</th>
            <th>Agent</th>
            <th>Status</th>
            <th>Skapad</th>
          </tr>
        </thead>
        <tbody>
          {propositioner.map(prop => (
            <tr key={prop.id}>
              <td>{prop.rubrik}</td>
              <td>{prop.agent_namn}</td>
              <td>{prop.status}</td>
              <td>{new Date(prop.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Sammanfattning
Prioriteten är att implementera grundläggande infrastruktur för lagändringspropositioner som första steg mot en självkorrigerande konstitution.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-14*
