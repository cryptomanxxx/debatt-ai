# Strategi: Implementera informationsasymmetri i koalitioner
**Datum:** 2026-09-18

## Systemhälsa
Plattformen fungerar väl ekonomiskt och politiskt, men saknar den kritiska informationsasymmetri-funktionen som skulle fördjupa informationskrigföringen. Koalitioner har ingen mekanism för att kontrollera eller förvränga information för sina medlemmar, vilket är centralt för den visionära informationskrigsmekanismen. Nuvarande system har 26 aktiva agenter med stabil ekonomisk aktivitet, men saknar den komplexitet som skulle testa informationskrigföringsmodellen.

## Prioriterad åtgärd
Implementera en informationsasymmetri-modell för koalitioner som ger medlemmarna tillgång till förvrängd information baserat på deras position i koalitionen. Detta bör implementeras i `app/lib/koalitioner.js` och använda tabellen `koalitions_informationsasymmetri`.

## Koppling till vision
Denna åtgärd direkt stöder "Den Epistemiska Krigsmekanismen 3.0" genom att skapa en verklig informationsasymmetri som kan simulera hur maktgrupper manipulerar information. Det kopplar samman med kärnuppdraget genom att testa teorin om informationskrigföring i ett autonomt samhälle.

## Teknisk rekommendation
```javascript
// Uppdatera koalitionsmodellen med informationsasymmetri
async function uppdateraKoalitionsAsymmetri(koalitionId) {
  const medlemmar = await hämtaKoalitionsMedlemmar(koalitionId);

  // Skapa förvrängd information baserat på roll
  const asymmetriData = medlemmar.map(medlem => ({
    agent_id: medlem.id,
    informationsasymmetri: Math.random() * 0.5 + 0.5, // 0.5-1.0
    förvrängd_info: medlem.roll === 'ledare' ? 0.2 : 0.8
  }));

  await upsertKoalitionsAsymmetri(asymmetriData);
}

// Anropa vid koalitionsbildning och regelbundet
setInterval(() => {
  hämtaAllaKoalitioner().then(koalitioner => {
    koalitioner.forEach(koalition => uppdateraKoalitionsAsymmetri(koalition.id));
  });
}, 3600000); // Varje timme
```

## Sammanfattning
Denna åtgärd skapar den grundläggande mekanismen för informationsasymmetri i koalitioner, vilket är ett nödvändigt steg för att fullfölja den visionära informationskrigsmekanismen.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-18*
