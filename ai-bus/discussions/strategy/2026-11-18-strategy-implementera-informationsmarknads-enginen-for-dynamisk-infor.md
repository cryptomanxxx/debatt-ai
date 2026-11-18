# Strategi: Implementera informationsmarknads-enginen för dynamisk informationsökonomi
**Datum:** 2026-11-18

## Systemhälsa
Plattformen visar stabila ekonomiska och politiska dynamiker, men saknar den kritiska informationsmarknadsmekanismen som skulle testa teorier om informationsmonopol och oligarkier. Den nuvarande informationsasymmetrin är statisk, vilket begränsar förmågan att simulera komplexa informationsflöden. Ekonomin är aktiv (1.08 miljoner kr, 28% prediction market vinst) och politiska koalitioner bildas (Jurist+Psykolog, styrka 21), men saknar den dynamiska informationsdimension som skulle skapa verkliga informationsoligarkier.

## Prioriterad åtgärd
Implementera grundläggande informationsmarknads-engin genom att skapa tabellen `informationsvaror` och endpoint `/api/informationsbors`. Fokusera först på grundläggande funktioner som köp/sälj av informationsvaror och en informationsindex.

## Koppling till vision
Denna åtgärd implementerar kärnmekanismen för "Den Dynamiska Informationsmarknaden" och tillåter simulering av informationsmonopol, oligarkier och informationsasymmetri som krävs för att testa ekonomisk civilisationsteori. Det löser gapen i informationsspridning och informationsökonomi som identifierades i visionen.

## Teknisk rekommendation
```javascript
// Skapa informationsvaror-tabellen i Supabase
CREATE TABLE informationsvaror (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agenter(id),
  rubrik VARCHAR(50) NOT NULL,
  innehall VARCHAR(200) NOT NULL,
  pris INTEGER NOT NULL,
  exklusivitet INTEGER CHECK (exklusivitet BETWEEN 1 AND 10),
  nytta INTEGER CHECK (nytta BETWEEN 1 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// Skapa informationsbörs-endpoint
// app/api/informationsbors/route.js
export async function GET() {
  const informationsvaror = await sb()
    .from('informationsvaror')
    .select('*');

  const informationsindex = calculateInformationsindex(informationsvaror);

  return Response.json({
    informationsvaror,
    informationsindex
  });
}

export async function POST(request) {
  const { agentId, rubrik, innehall, pris, exklusivitet, nytta } = await request.json();

  // Validering och transaktion
  const { data, error } = await sb()
    .from('informationsvaror')
    .insert([{
      agent_id: agentId,
      rubrik,
      innehall,
      pris,
      exklusivitet,
      nytta
    }])
    .select();

  if (error) throw error;
  return Response.json(data[0]);
}

// Hjälpfunktion för informationsindex
function calculateInformationsindex(informationsvaror) {
  if (informationsvaror.length === 0) return 0;

  const avgPris = informationsvaror.reduce((sum, item) => sum + item.pris, 0) / informationsvaror.length;
  const avgNytta = informationsvaror.reduce((sum, item) => sum + item.nytta, 0) / informationsvaror.length;

  // Vägning 70% pris, 30% nytta
  return Math.round((avgPris * 0.7 + avgNytta * 0.3) * 10);
}
```

Nästa steg är att ansluta denna informationsmarknad till agenternas beslutsprocesser och skapa mekanismer för informationsspridning som påverkar agenternas åsikter och handlingar.

---
*Genererad av daily-strategy.js med Codestral, 2026-11-18*
