# Strategi: Implementera Historisk Replikationsmekanism för institutionell minneslagring
**Datum:** 2026-09-09

## Systemhälsa
Plattformen fungerar väl tekniskt, men saknar mekanismer för att institutioner (partier, företag) ska ärva och internalisera formativa händelser över tid. De 26 aktiva agenterna interagerar nu, men saknar mekanism för att minnas och förmedla generationer av erfarenheter - ett fundamentalt gap för att simulera verkliga civilisationer. Den starkaste koalitionen (Den stressade+Jurist) har styrka 17, vilket tyder på stabila relationer, men saknar mekanism för att dessa relationer ska förändras över tid. Ekonomiskt är systemet stabilt (total ekonomi 130258 kr), men saknar mekanism för att institutioner ska lära sig av tidigare kriser.

## Prioriterad åtgärd
Implementera en `historiska_avtryck`-tabell som fångar formativa händelser och låter dem "smitta" institutioner med en halveringstid. Fokusera först på ekonomiska chocker (t.ex. energikriser) och politiska skandaler.

## Koppling till vision
Detta löser det identifierade gapet i visionen om intergenerationell traumaanalogi. Nuvarande system kan inte förklara hur en bankkris 2026 skulle påverka politisk misstro 2030, vilket är centralt för att simulera verkliga civilisationer.

## Teknisk rekommendation
```javascript
// 1. Skapa historiska_avtryck-tabell
CREATE TABLE historiska_avtryck (
  id SERIAL PRIMARY KEY,
  datum TIMESTAMP,
  avtryckstyp TEXT, // 'ekonomisk_chock', 'politisk_skandal', etc.
  styrka FLOAT, // 0-1
  beskrivning TEXT,
  påverkade_institutioner TEXT[], // Array av parti_id/foretag_id
  halveringstid_dagar INTEGER // 30 för ekonomiska, 90 för politiska
);

// 2. Uppdatera partier-tabell
ALTER TABLE partier ADD COLUMN minnesavtryck TEXT[]; // Array av avtryck_id

// 3. Skapa avtrycksregistreringsskript (körs efter varje civilisationshistorik)
async function registreraAvtryck() {
  const händelser = await hämtaFormativaHändelser();
  for (const händelse of händelser) {
    await db.insert('historiska_avtryck').values({
      avtryckstyp: händelse.typ,
      styrka: händelse.styrka,
      beskrivning: händelse.beskrivning,
      påverkade_institutioner: händelse.påverkade,
      halveringstid_dagar: händelse.typ === 'ekonomisk_chock' ? 30 : 90
    });
  }
}

// 4. Uppdatera beslutslogik för partier
async function taBeslut(partiId) {
  const aktivaAvtryck = await db.query.historiska_avtryck
    .where('påverkade_institutioner', '&&', [partiId])
    .where('styrka', '>', 0.3); // Minsta intressant styrka

  // Justera beslut baserat på aktiva avtryck
  // ...
}
```

Denna implementation ger institutioner en mekanism för att minnas och förmedla erfarenheter över generationer, vilket är centralt för att simulera verkliga civilisationer.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-09*
