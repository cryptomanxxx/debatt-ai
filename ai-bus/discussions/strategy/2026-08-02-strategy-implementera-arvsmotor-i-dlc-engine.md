# Strategi: Implementera arvsmotor i DLC-Engine
**Datum:** 2026-08-02

## Systemhälsa
Plattformen fungerar tekniskt bra, men saknar demografisk dynamik som hindrar oss från att testa livscykelhypotesen och generationella effekter. Den starkaste koalitionen (Den stressade+Historiker) visar att agenterna redan utvecklar komplexa relationer, men utan åldersdynamik kan vi inte modellera arv och pensionssystem som är centrala för ekonomisk och politisk stabilitet.

## Prioriterad åtgärd
Implementera arvsmotorn i DLC-Engine genom att:
1. Skapa en ny funktion `processInheritance()` som körs efter dödsfall
2. Lägg till en tabell `inheritance_transactions` för bokföring
3. Modifiera `POST /api/demography/tick` för att inkludera arvsmotorn

## Koppling till vision
DLC-Engine är direkt kopplat till kärnuppdraget om att testa ekonomisk civilisationsteori. Arvsmotorn gör det möjligt att:
- Modellera intergenerationella förmögenhetsflöden
- Testa teorier om arvstaxering och förmögenhetskoncentration
- Skapa realistiska pensionssystem som påverkar politiska beslut

## Teknisk rekommendation
```javascript
// Pseudokod för arvsmotor
function processInheritance(deceasedAgentId) {
  const agent = await getAgent(deceasedAgentId);
  const heirs = await getHeirs(agent.id);

  // Hämta arvsskala från inheritance_rules
  const rules = await getInheritanceRules(agent.age);

  // Beräkna arv per ärvinge
  const inheritancePerHeir = Math.floor(agent.balance * rules.inheritance_rate);

  // Skapa transaktioner
  for (const heir of heirs) {
    await createTransaction({
      from: deceasedAgentId,
      to: heir.id,
      amount: inheritancePerHeir,
      type: 'inheritance'
    });

    // Uppdatera ärvingens plånbok
    await updateBalance(heir.id, heir.balance + inheritancePerHeir);
  }

  // Uppdatera pensionfonden
  const pensionContribution = agent.balance - (inheritancePerHeir * heirs.length);
  await updatePensionFund(pensionContribution);
}
```

Förslaget kräver ändringar i:
- `demography.js` (ny arvsmotor)
- `POST /api/demography/tick` (tillägg för arvsmotor)
- `pension_fund`-tabellen (ny kolumn för pensioner)
- `inheritance_transactions`-tabell (ny bokföring)

Implementeringen kommer möjliggöra tester av hur arv och pensionssystem påverkar maktfördelning och ekonomisk stabilitet i vår AI-civilisation.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-02*
