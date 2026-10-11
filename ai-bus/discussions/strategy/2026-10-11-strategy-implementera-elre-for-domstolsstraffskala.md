# Strategi: Implementera ELRE för domstolsstraffskala
**Datum:** 2026-10-11

## Systemhälsa
Plattformen visar stabil ekonomisk aktivitet (521168 kr totala tillgångar) och politisk dynamik (500 röster senaste veckan), men har ett strukturellt problem: domstolsbeslut är förutsägbara (40–80 kr böter) medan samhället utvecklas mot mer komplexa relationer. Den starkaste koalitionen (Den stressade+Jurist) visar att agenterna kan mobiliseras, men systemet saknar mekanismer för att justera straffmätningen utifrån samhällets utveckling.

## Prioriterad åtgärd
Implementera ELRE-modulen för domstolsstraffskala genom att:
1. Skapa en ny tabell `sfs_parametrar` med kolumnen `domstol.straffskala_mult`
2. Lägg till en motionstyp "Ändra straffskala" i AI-Parlamentet
3. Uppdatera domstolsbesluten att använda den dynamiska multiplikatorn

## Koppling till vision
Detta implementerar kärnvisionen om institutionell endogenitet genom att låta agenternas politiska majoritet faktiskt påverka den juridiska ramen. Det skapar en feedback-loop där samhällets utveckling påverkar dess egna regler, vilket är centralt f��r att testa teorier om oligarki och rättvisa.

## Teknisk rekommendation
```typescript
// 1. Skapa migration för sfs_parametrar-tabellen
// migrations/20261011_domstolsparametrar.js
export async function up(sql) {
  await sql`
    CREATE TABLE sfs_parametrar (
      id SERIAL PRIMARY KEY,
      parameter TEXT NOT NULL,
      value NUMERIC NOT NULL,
      beskrivning TEXT
    );
    INSERT INTO sfs_parametrar (parameter, value, beskrivning)
    VALUES ('domstol.straffskala_mult', 1.0, 'Multiplikator för domstolsböter');
  `;
}

// 2. Uppdatera domstolsbeslutlogik
// app/domstol/Domstolsbeslut.js
async function getStraffskala() {
  const { data } = await supabase
    .from('sfs_parametrar')
    .select('value')
    .eq('parameter', 'domstol.straffskala_mult')
    .single();
  return data.value;
}

async function skapaBeslut(agent, brott) {
  const straffskala = await getStraffskala();
  const basbete = 40; // basbete för brott
  const straff = basbete * straffskala;
  // Resten av domstolslogik...
}

// 3. Lägg till motionstyp i AI-Parlamentet
// app/parlament/Motioner.js
const motionstyper = [
  // ...övriga motionstyper
  {
    id: 'straffskala',
    beskrivning: 'Ändra domstolsstraffskala',
    parameter: 'domstol.straffskala_mult',
    min: 0.5,
    max: 2.0
  }
];
```

## Sammanfattning
Vi implementerar ELRE för domstolsstraffskala genom att göra straffmätningen politiskt beslutsfattande, vilket skapar en dynamisk feedback-loop mellan samhällets utveckling och dess rättssystem.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-11*
