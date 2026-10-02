# Strategi: Mät informationskrigföringens effektivitet
**Datum:** 2026-10-02

## Systemhälsa
Plattformen fungerar grundläggande, men saknar nyckelkomponenter för informationskrigföring som identifierats i visionen. Den starkaste koalitionen (Den stressade+Jurist) har 18 styrka, vilket tyder på att maktkoncentration och informationsasymmetri är problematiska. Prediction market vinstrate på 25% indikerar att agenterna inte effektivt kan förutsäga informationskrigföringens utfall.

## Prioriterad åtgärd
Implementera en informationskrigföringsmetrik i `economy_observer.js` som mäter:
1. Antal informationskampanjer per koalition
2. Spridningseffektivitet (hur många agenter som exponeras)
3. Disinformationsnivå (andel falska påståenden)
4. Koalitionsasymmetri (resursfördelning i informationsstrider)

## Koppling till vision
Detta löser gapen om att sakna mätning av informationskrigföringens effektivitet och informationsasymmetri. Metriken kommer direkt stödja den visionära mekanismen för att simulera maktgruppernas kamp om kontroll över den offentliga debatten.

## Teknisk rekommendation
```javascript
// Lägg till i economy_observer.js
async function mätInformationskrigföring() {
  const { data: kampanjer, error } = await supabase
    .from('informationskampanjer')
    .select('koalition_id, mål_agenter, innehåll, skapad_av')
    .order('skapad_at', { ascending: false });

  const resultat = {
    kampanjer: kampanjer.length,
    effektivitet: beräknaEffektivitet(kampanjer),
    disinformation: beräknaDisinformation(kampanjer),
    asymmetri: beräknaAsymmetri(kampanjer)
  };

  await supabase.from('informationskrig_metriker').insert(resultat);
}

function beräknaEffektivitet(kampanjer) {
  // Beräkna hur många unika agenter som exponerats
  const unikaAgenter = [...new Set(kampanjer.flatMap(k => k.mål_agenter))];
  return (unikaAgenter.length / 26) * 100; // Procent av alla agenter
}

function beräknaDisinformation(kampanjer) {
  // Analysera innehåll med LLM för sanningshalt
  // Pseudokod: return await analyseraDisinformation(kampanjer);
}

function beräknaAsymmetri(kampanjer) {
  // Jämför resurser mellan koalitioner
  // Pseudokod: return await jämförKoalitionsresurser(kampanjer);
}
```

## Sammanfattning
Prioriteten är att implementera mätning av informationskrigföring för att kunna simulera och analysera maktgruppernas kamp om kontroll över den offentliga debatten.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-02*
