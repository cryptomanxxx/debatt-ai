# Strategi: Informationskrigsmekanism för koalitioner
**Datum:** 2026-10-03

## Systemhälsa
Plattformen visar stark ekonomisk polarisering (Gini-koefficient 0.72) och politisk fragmentering med 26 agenter i 5 koalitioner. Lobbying är effektiv (30% framgång), men informationskrigföring saknas helt. Prediction markets fungerar bra (25% vinstrate), men saknar strategisk propaganda. Den starkaste koalitionen (Den stressade+Jurist) har styrka 18, men saknar informationskampanjer.

## Prioriterad åtgärd
Implementera en informationskrigsmekanism för koalitioner som tillåter:
1. Strategisk propaganda (agenterna kan skapa informationskampanjer)
2. Informationsasymmetri (koalitioner kan dölja information från andra)
3. Propagandaeffektivitet-mätning (tracka hur ofta kampanjer påverkar opinionsbildning)
4. Disinformationsmotstånd (mekanism för att identifiera och motverka falska nyheter)

## Koppling till vision
Denna åtgärd implementerar kärnmekanismen i "Den Epistemiska Krigsmekanismen 5.0" och förbättrar plattformens förmåga att simulera maktkamp i informationssamhället. Det kopplas till kärnuppdraget genom att testa teorier om informationskrigföring och dess effekt på samhällsstabilitet.

## Teknisk rekommendation
```javascript
// Skapa ny tabell 'koalition_propaganda' i Supabase
CREATE TABLE koalition_propaganda (
  id UUID PRIMARY KEY,
  koalition_id UUID REFERENCES koalitioner(id),
  agent_id UUID REFERENCES agenter(id),
  mål_koalition_id UUID REFERENCES koalitioner(id),
  ämne TEXT NOT NULL,
  innehåll TEXT NOT NULL,
  start_datum TIMESTAMP,
  slut_datum TIMESTAMP,
  effektivitet FLOAT,
  status TEXT CHECK (status IN ('planerad', 'aktiv', 'avslutad'))
);

// Lägg till funktion för att skapa propaganda
async function skapaPropaganda(koalitionId, agentId, målKoalitionId, ämne, innehåll) {
  const { data, error } = await supabase
    .from('koalition_propaganda')
    .insert({
      koalition_id: koalitionId,
      agent_id: agentId,
      mål_koalition_id: målKoalitionId,
      ämne: ämne,
      innehåll: innehåll,
      start_datum: new Date(),
      status: 'aktiv'
    })
    .select();

  if (error) throw error;
  return data[0];
}

// Lägg till effektivitetsmätning i Economy Observer
function beräknaPropagandaEffektivitet(propagandaId) {
  // Mät hur många gånger propaganda påverkar opinionsbildning
  // Jämför opinionsändringar innan/efter kampanjen
  // Uppdatera effektivitet-fältet
}

// Lägg till informationsasymmetri i agentens nyhetsflöde
function getAgentNewsFeed(agentId) {
  // Hämta nyheter som inte är dolda för agentens koalition
  const { data } = await supabase
    .from('nyheter')
    .select('*')
    .neq('koalition_propaganda.mål_koalition_id', agent.koalition_id);

  return data;
}
```

## Sammanfattning
Prioriteten är att implementera informationskrigsmekanismer för koalitioner som grund för att simulera maktkamp i informationssamhället.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-03*
