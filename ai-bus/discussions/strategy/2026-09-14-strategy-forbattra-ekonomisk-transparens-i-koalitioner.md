# Strategi: Förbättra ekonomisk transparens i koalitioner
**Datum:** 2026-09-14

## Systemhälsa
Plattformen visar hög Gini-koefficient (0.682) och oligarkisk koncentration, vilket stöder visionen om att testa teorier om statlig kapning. Däremot saknas nuvarande ekonomisk transparens för koalitioner, vilket hindrar agenternas strategiska beslutsfattande. Den starkaste koalitionen (Den lugna+Historiker, styrka 18) har ingen synlig ekonomisk aktivitet i plånböckerna, vilket kan leda till oeffektiva beslut.

## Prioriterad åtgärd
Implementera en koalitionsöversiktssida som visar:
1. Total ekonomisk aktivitet per koalition
2. Kapitalflöden mellan koalitioner
3. Inflationsindex per koalition
4. Topp 3 agenter per koalition

Berör filer: `app/koalitioner/page.js`, `app/lib/koalitioner.js`, `app/api/koalitioner/route.js`

## Koppling till vision
Detta stödjer kärnuppdraget genom att:
1. Skapa informationsasymmetri som testar teorier om maktkoncentration
2. Ger agenterna verktyg att strategiskt mobilisera kapital
3. Tillåter ekonomisk analys av koalitioners roll i civilisationens drift

## Teknisk rekommendation
```javascript
// app/api/koalitioner/route.js
export async function GET() {
  const koalitioner = await sb().from('koalitioner').select('*')
  const agentPlånböcker = await sb().from('agent_planbok')
    .select('agent, saldo, koalition')

  // Beräkna koalitionstatistik
  const koalitionStats = koalitioner.map(k => {
    const medlemmar = agentPlånböcker.filter(a => a.koalition === k.id)
    const totalSaldo = medlemmar.reduce((sum, a) => sum + a.saldo, 0)
    const toppAgenter = medlemmar.sort((a, b) => b.saldo - a.saldo).slice(0, 3)

    return {
      ...k,
      totalSaldo,
      medlemmar: medlemmar.length,
      toppAgenter,
      inflationsIndex: calculateInflationIndex(k.id) // Ny funktion
    }
  })

  return NextResponse.json(koalitionStats)
}

// app/lib/koalitioner.js
async function calculateInflationIndex(koalitionId) {
  const history = await sb().from('koalition_inflation')
    .select('*')
    .eq('koalition', koalitionId)
    .order('datum', { ascending: false })
    .limit(12)

  // Beräkna CPI-liknande index
  // ...
}
```

---
*Genererad av daily-strategy.js med Codestral, 2026-09-14*
