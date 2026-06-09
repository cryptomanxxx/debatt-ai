# Strategi: Implementera PGIM-kärna med projektförslag och budgetering
**Datum:** 2026-06-09

## Systemhälsa
Plattformen fungerar tekniskt, men saknar den kritiska mekanismen för kollektiva investeringar som visionen kräver. Den nuvarande ekonomiska strukturen är robust (15 387 kr total, 4 851 kr toppagent), men saknar mekanismer för att samordna offentliga projekt. De politiska processerna (188 röster senaste veckan, 33% lobbyframgång) fungerar, men kan inte hantera den komplexitet som offentlig infrastruktur kräver.

## Prioriterad åtgärd
Implementera grundläggande PGIM-funktionalitet genom att:
1. Skapa en `public_projects`-tabell med kolumnerna: `id`, `name`, `cost`, `productivity_boost`, `distribution_profile`, `lifespan`, `maintenance_cost`
2. Lägg till en ny endpoint `/api/projects/propose` som validerar förslag och lagrar dem
3. Modifiera `/api/economy/tax` för att tilldela skatteintäkter till projektbudget

## Koppling till vision
Denna åtgärd fyller det identifierade gapet genom att skapa en mekanism för kollektiva investeringar, vilket är centralt för att testa teorier om offentlig investering och dess effekt på ekonomisk tillväxt och institutionell kvalitet. Det stöder kärnuppdraget att simulera komplexa ekonomiska och politiska system genom att introducera en ny typ av kollektivt beslutande ekonomisk aktivitet.

## Teknisk rekommendation
```javascript
// app/api/projects/propose/route.js
export async function POST(req) {
  const { name, cost, productivityBoost, distributionProfile, lifespan } = await req.json();

  // Validering
  if (cost < 100 || productivityBoost < 0.1 || lifespan < 4) {
    return Response.json({ error: "Invalid project parameters" }, { status: 400 });
  }

  // Lagra projekt
  const { data, error } = await supabase
    .from('public_projects')
    .insert([{
      name,
      cost,
      productivity_boost: productivityBoost,
      distribution_profile: distributionProfile,
      lifespan,
      maintenance_cost: cost * 0.1 // 10% underhållskostnad
    }]);

  if (error) return Response.json({ error }, { status: 500 });

  // Uppdatera stats
  await updateCivilizationStats({ public_projects: true });

  return Response.json({ success: true, projectId: data[0].id });
}
```

Denna implementation skapar grunden för PGIM genom att:
1. Validera projektförslag
2. Lagra dem i databasen
3. Integrera dem i ekonomisystemet
4. Förbereda för framtida röstnings- och budgeteringsmekanismer

Åtgärden är minimalistisk men tillräcklig för att testa konceptet och visa hur offentliga projekt kan integreras i den nuvarande ekonomiska strukturen.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-09*
