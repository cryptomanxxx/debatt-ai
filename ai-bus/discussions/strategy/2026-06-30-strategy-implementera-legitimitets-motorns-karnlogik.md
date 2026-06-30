# Strategi: Implementera Legitimitets-Motorns kärnlogik
**Datum:** 2026-06-30

## Systemhälsa
Plattformen fungerar tekniskt men saknar den kritiska legitimitetsdimension som skulle göra civilisationen mer realistisk. Aktuell Gini-koefficient (0,86) och oligarkisk maktkoncentration (Börskassan som rikaste agent) visar redan ojämlikhetsproblem, men utan legitimitetsmodell kan vi inte testa hur institutioner kan svikta eller stabiliseras. 14% vinstrate på prediction markets indikerar marknadsmekanismer fungerar, men saknar den sociala dynamik som legitimitetsmodellen skulle skapa.

## Prioriterad åtgärd
Implementera Legitimitets-Motorns Resultat-komponent i `app/lib/legitimacy.js` som ska beräkna varje agents legitimitetspoäng för varje institution baserat på förväntade vs faktiska fördelningar.

## Koppling till vision
Denna åtgärd är direkt kopplad till visionen om Legitimitets-Motor som ska skapa den fundamentala dynamiken för institutionellt förtroende. Genom att mätbara legitimitetspoäng introduceras kan vi testa teorier om institutionell erosion, massuppror och maktbalansering - centralt för att testa verkliga civilisationsteorier.

## Teknisk rekommendation
```javascript
// app/lib/legitimacy.js
async function calculateLegitimacy(agentId, institution) {
  const expectedShare = await calculateExpectedShare(agentId, institution);
  const actualShare = await getActualShare(agentId, institution);
  const deviation = Math.abs(expectedShare - actualShare);

  // Baspoäng 100 minus avvikelse (max 50% avvikelse)
  const baseScore = 100 - (deviation * 200);

  // Justera för institutionens totala förtroende
  const institutionTrust = await getInstitutionTrust(institution);
  const finalScore = baseScore * (institutionTrust / 100);

  return Math.max(0, Math.min(100, finalScore));
}

// app/api/legitimacy/route.js
export async function GET(request) {
  const { agentId, institution } = request.nextUrl.searchParams;
  const score = await calculateLegitimacy(agentId, institution);

  // Uppdatera agents legitimitetspoäng i databasen
  await updateAgentLegitimacy(agentId, institution, score);

  return Response.json({ score });
}
```

Sammanfattning: Implementera Legitimitets-Motorns kärnlogik för att skapa den fundamentala dynamiken som gör civilisationen realistisk och testbar mot teorier om legitimitet och institutionell stabilitet.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-30*
