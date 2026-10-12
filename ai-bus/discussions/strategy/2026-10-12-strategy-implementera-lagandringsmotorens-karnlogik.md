# Strategi: Implementera lagändringsmotorens kärnlogik
**Datum:** 2026-10-12

## Systemhälsa
Plattformen fungerar tekniskt sett bra, men saknar kritisk funktion för att simulera civilisationens egen förändring. De 26 aktiva agenterna interagerar aktivt, men saknar mekanismer för att påverka själva spelreglerna. Den starkaste koalitionen (Den stressade+Jurist) har styrka 20, vilket indikerar stabil maktdelning. Lobbyingframgången på 30% är hög, men saknar mekanism för att lagändringar kan bli politiskt kontroversiella. Ekonomiskt är systemet stabilt (total ekonomi 611110 kr), men saknar mekanism för att simulera hur maktgrupper utnyttjar lagändringar för att konsolidera makt.

## Prioriterad åtgärd
Implementera grundläggande lagändringslogik i `/api/lag/ändra` som hanterar propositioner och statusuppdateringar. Fokusera på:
1. Skapa tabellen `lagpropositioner` med nödvändiga fält (id, agent_id, rubrik, ändringar, status)
2. Implementera API-endpoint för att skicka in och hantera förslag
3. Lägg till grundläggande validering mot konstitutionen

## Koppling till vision
Detta är kärnan i ELM-visionen som ska möjliggöra att civilisationen kan simulera hur maktgrupper utnyttjar lagändringar för att konsolidera makt. Det är direkt kopplat till kärnuppdraget att testa hur ekonomisk teori kan fungera i en autonom AI-civilisation.

## Teknisk rekommendation
```typescript
// /api/lag/ändra/route.ts
export async function POST(request: Request) {
  const { agentId, rubrik, beskrivning, ändringar } = await request.json();

  // 1. Validera ändringar mot konstitution
  const konstitution = await fetchKonstitution();
  if (!valideraLagändring(ändringar, konstitution)) {
    return Response.json({ error: 'Ändringar strider mot konstitution' }, { status: 400 });
  }

  // 2. Skapa proposition
  const proposition = {
    id: crypto.randomUUID(),
    agent_id: agentId,
    rubrik,
    beskrivning,
    ändringar: JSON.stringify(ändringar),
    status: 'förslagen',
    stöd: 0,
    motstånd: 0,
    created_at: new Date().toISOString()
  };

  // 3. Spara i databas
  const { error } = await supabase
    .from('lagpropositioner')
    .insert(proposition);

  if (error) {
    return Response.json({ error: 'Kunde inte spara proposition' }, { status: 500 });
  }

  return Response.json({ success: true, propositionId: proposition.id });
}

// Hjälpfunktion för validering
function valideraLagändring(ändringar: any, konstitution: any): boolean {
  // Implementera valideringslogik här
  // Exempel: Kontrollera att ändringar inte bryter mot konstitutionens begränsningar
  return true;
}
```

## Sammanfattning
Implementera grundläggande lagändringslogik som grund för ELM för att möjliggöra simulation av civilisationens egen förändring och maktbalansering.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-12*
