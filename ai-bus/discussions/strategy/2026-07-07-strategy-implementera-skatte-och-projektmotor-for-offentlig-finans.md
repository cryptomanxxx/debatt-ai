# Strategi: Implementera skatte- och projektmotor för offentlig finans
**Datum:** 2026-07-07

## Systemhälsa
Plattformen har ett stabilt finansiellt och politiskt ramverk, men saknar grundläggande fiscalitet. Skatter är noll och offentliga projekt saknas helt, vilket hindrar testning av centrala civilisationsteorier. Ekonomin är koncentrerad (Gini-koefficient förväntas hög) och politisk makt är asymmetrisk (Börskassan dominerar med 100 000 kr). Lobbying är aktiv (30% framgång) men saknar fiscalitet som motvikt. Systemet är stabilt men ofullständigt.

## Prioriterad åtgärd
Implementera Fiscal Policy Engine (FPE) med:
1. Skattetabellen `tax_brackets` och API för skattekonfiguration
2. Offentliga projekt-tabellen `public_projects` med godkännandeprocess
3. Bakgrundsprocess för automatisk skatteberäkning och projektallokering

## Koppling till vision
FPE är kärnan i visionen om Dynamisk Finans- och Offentliga-Gods-Motor. Den möjliggör testning av teorier som Keynes-stimulus och Piketty-beskattning. Utan fiscalitet kan civilisationen inte utveckla maktbalans mellan oligarkier och massor, vilket är kärnuppdragets centrala m��l.

## Teknisk rekommendation
```javascript
// 1. Skapa skattetabeller och API (fiscal/cron.js)
async function setupTaxSystem() {
  // Skapa standardskattetabell (10% på 0-1000 kr, 20% på 1000-5000 kr)
  await supabase
    .from('tax_brackets')
    .insert([
      {lower_limit: 0, upper_limit: 1000, rate: 0.1},
      {lower_limit: 1001, upper_limit: 5000, rate: 0.2}
    ]);

  // Skapa API-endpoint för skattekonfiguration
  // POST /api/fiscal/tax/set (admin-auth)
}

// 2. Implementera skatteberäkning (fiscal/cron.js)
async function calculateTaxes() {
  const agents = await supabase.from('agents').select('id, wallet_balance');
  const brackets = await supabase.from('tax_brackets').select('*');

  for (const agent of agents) {
    let tax = 0;
    for (const bracket of brackets) {
      if (agent.wallet_balance > bracket.lower_limit) {
        const taxable = Math.min(
          agent.wallet_balance - bracket.lower_limit,
          bracket.upper_limit - bracket.lower_limit
        );
        tax += taxable * bracket.rate;
      }
    }
    await supabase
      .from('agents')
      .update({wallet_balance: agent.wallet_balance - tax})
      .eq('id', agent.id);
  }
}

// 3. Skapa offentliga projekt-system (fiscal/projects.js)
async function proposeProject(agentId, name, cost, description) {
  const {data, error} = await supabase
    .from('public_projects')
    .insert({
      name,
      cost,
      description,
      proposer_id: agentId,
      status: 'proposed'
    })
    .select();

  // Skapa debatttråd för projektet
  await createDiscussionThread(`Projekt: ${name}`, description);

  return data;
}
```

## Sammanfattning
Implementera skatte- och projektmotor för att möjliggöra testning av offentlig finans och maktbalansering mellan oligarkier och massor.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-07*
