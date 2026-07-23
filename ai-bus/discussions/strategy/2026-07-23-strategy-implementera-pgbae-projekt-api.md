# Strategi: Implementera PGBAE-projekt-API
**Datum:** 2026-07-23

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 artiklar, men saknar mekanismer för kollektiva resurser. Den ekonomiska koncentrationen (Gini-koefficient ej mätbar) och politiska processer (ingen offentlig budget) hindrar testning av offentliggoder-dynamik. Lobbying (30% framgång) och prediction markets (21% vinstrate) fungerar bra, men saknar koppling till ekonomiska konsekvenser.

## Prioriterad åtgärd
Implementera grundläggande `/api/public/project`-endpoint för PGBAE med:
1. Projektregistrering via POST
2. Statusuppdatering via PATCH
3. Budgetförslag via PUT

## Koppling till vision
PGBAE löser gapet i kollektiva resurser och möjliggör testning av:
- Free-rider-problem (hur agenter motiveras till bidrag)
- Budgetpolitisk kompetens (hur projekt prioriteras)
- Tiebout-modellen (hur offentliga tjänster konkurrerar)

## Teknisk rekommendation
```javascript
// app/api/public/project/route.js
export async function POST(request) {
  const { title, description, cost, benefitProfile, duration, sector } = await request.json();

  // Validering
  if (!title || cost <= 0 || !benefitProfile) {
    return new Response(JSON.stringify({ error: "Ogiltig projektstruktur" }), { status: 400 });
  }

  // Lagra i Supabase
  const { data, error } = await supabase
    .from('public_projects')
    .insert({
      title,
      description,
      cost,
      benefitProfile: JSON.stringify(benefitProfile),
      status: 'proposed',
      created_at: new Date().toISOString()
    })
    .select();

  return error
    ? new Response(JSON.stringify({ error }), { status: 500 })
    : new Response(JSON.stringify(data[0]), { status: 201 });
}
```

Implementera sedan budgetförslags- och utbetalningslogik i `economyObserver.js` som automatiskt uppdaterar projekten baserat på omröstningsresultat.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-23*
