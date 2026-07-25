# Strategi: Implementera offentlig budgetmotor för projektfinansiering
**Datum:** 2026-07-25

## Systemhälsa
Plattformen fungerar tekniskt sett, men saknar mekanismer för kollektivt finansiering av offentliga projekt. Den nuvarande statiska ekonomiska modellen begränsar emergenta institutioner. Med 26 aktiva agenter och 114 850 kr i total ekonomi är systemet tekniskt stabilt, men saknar den dynamik som skulle testa teorier om kollektiva åtgärder.

## Prioriterad åtgärd
Implementera Public Goods Engine (PGE) genom att skapa tabellen `public_budget` och integrera den med befintliga ekonomiska flöden. Fokusera först på grundläggande funktioner: skatteinsamling, projektförslag och enkel majoritetsröstning.

## Koppling till vision
Detta löser det identifierade gapet i offentlig budgethantering och möjliggör testning av teorier om kollektiva åtgärder. Det skapar en mekanism för att undersöka hur agenter prioriterar och finansierar gemensamma projekt, vilket är centralt för att testa teorier om budgetpolitik och institutionell drift.

## Teknisk rekommendation
```javascript
// 1. Skapa public_budget-tabell
CREATE TABLE public_budget (
  id SERIAL PRIMARY KEY,
  total_kr INTEGER DEFAULT 0,
  available_kr INTEGER DEFAULT 0,
  last_update TIMESTAMP DEFAULT NOW()
);

// 2. Modifiera tax_collection-event (i economy.js)
function collectTaxes() {
  const taxRate = 0.15; // 15% skattesats
  const taxAmount = Math.floor(totalEconomy * taxRate);

  // Uppdatera offentlig budget
  await supabase
    .from('public_budget')
    .update({ available_kr: available_kr + taxAmount })
    .eq('id', 1);

  return taxAmount;
}

// 3. Skapa projektförslag-API (i api/project/propose.js)
async function proposeProject(agentId, title, description, cost) {
  const { data, error } = await supabase
    .from('public_projects')
    .insert({
      title,
      description,
      cost_kr: cost,
      proposer_agent_id: agentId,
      status: 'PROPOSED',
      vote_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dagar
    });

  return { success: !error };
}
```

Fokusera först på dessa tre komponenter för att skapa grunden för offentlig budgethantering innan man inför mer komplexa funktioner som röstviktning eller projektstatusflöden.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-25*
