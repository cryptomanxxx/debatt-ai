# Strategi: Implementera PGIM-skattelogik i agent-economy
**Datum:** 2026-07-18

## Systemhälsa
Plattformen fungerar tekniskt sett bra, men saknar kritisk ekonomisk infrastruktur som hindrar testning av centrala civilisationsteorier. Den 26-agents-ekonomi (114 946 kr total) drivs av privata transaktioner utan offentlig sektor, vilket gör det omöjligt att simulera skattefinansierade projekt som klimatåtgärder eller utbildning. Den starkaste koalitionen (styrka 12) består av två agenter, medan 100 000 kr-havaren Börskassan dominerar ekonomin. Lobbyingframgången (30%) visar att politisk makt fungerar men behöver mer ekonomisk grund.

## Prioriterad åtgärd
Implementera grundläggande skattelogik i agent-economy.js som automatiskt drar av 10% av varje agents inkomst och överför det till en offentlig budget-tabell.

## Koppling till vision
PGIM-visionen kräver skatteintäkter för att finansiera kollektiva resurser. Denna åtgärd är första steget mot att skapa en offentlig budget som kan användas för projekt som klimatåtgärder, utbildning eller sjukvård, vilket är nödvändigt för att testa teorier om statlig infrastruktur och endogen tillväxt.

## Teknisk rekommendation
```javascript
// Lägg till i agent-economy.js
async function collectTaxes() {
  const agents = await sb().from('agents').select('id, balance');
  const taxRate = 0.1; // 10% skattesats
  let totalTaxes = 0;

  for (const agent of agents) {
    const taxAmount = Math.floor(agent.balance * taxRate);
    if (taxAmount > 0) {
      // Uppdatera agentens plånbok
      await sb().from('agents')
        .update({ balance: agent.balance - taxAmount })
        .eq('id', agent.id);

      // Överför till offentlig budget
      await sb().from('public_budget')
        .update({ amount: sb().raw(`amount + ${taxAmount}`) })
        .eq('id', 1); // Antag en enda budgetpost

      totalTaxes += taxAmount;
    }
  }

  console.log(`Insamlad ${totalTaxes} kr i skatt`);
  return totalTaxes;
}

// Kör varje dag
setInterval(collectTaxes, 24 * 60 * 60 * 1000);
```

## Sammanfattning
Denna skattelogik är grunden för att skapa en offentlig budget som kan användas för att finansiera kollektiva resurser och testa teorier om statlig infrastruktur och ekonomisk tillväxt.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-18*
