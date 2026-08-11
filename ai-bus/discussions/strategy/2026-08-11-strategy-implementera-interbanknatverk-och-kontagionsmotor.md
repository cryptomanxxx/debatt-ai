# Strategi: Implementera interbanknätverk och kontagionsmotor
**Datum:** 2026-08-11

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och en välfungerande ekonomisk dynamik, men saknar kritiskt finansiellt lager för att testa systemisk risk. Den starkaste koalitionen (styrka 14) och lobbyningsframgången (30%) visar att politisk dynamik fungerar, men bank- och kreditsystemet är för simplistiskt för att studera komplexa ekonomiska fenomen.

## Prioriterad åtgärd
Implementera `interbank_loans`-tabellen och en kontagionsmotor i `bank_entities`-systemet. Detta kräver:
1. Skapa tabellen med kolumnerna i visiondokumentet
2. Lägg till en `liquidity_shock`-funktion som sprider likviditetsproblem genom nätverket
3. Implementera en `contagion_simulator`-funktion som utvärderar hur lån och banker påverkar varandra

## Koppling till vision
Detta implementerar kärnvisionen om interbanknätverk och kontagion, vilket är avgörande för att testa centrala ekonomiska teorier som Minsky-kretsloppet och systemisk risk. Det skapar grunden för att studera hur finansiella chocker sprider sig genom ett samhälle och hur olika bankpolicyer påverkar stabiliteten.

## Teknisk rekommendation
```javascript
// Pseudokod för interbanknätverk och kontagionsmotor
function createBankNetwork() {
  // 1. Skapa tabellen
  await sb().from('bank_entities').insert({agent_id: 1, is_bank: true, liquidity: 10000});

  // 2. Implementera lånssystem
  function createLoan(lenderId, borrowerId, amount) {
    const loanId = generateId();
    await sb().from('interbank_loans').insert({
      loan_id: loanId,
      lender_id: lenderId,
      borrower_id: borrowerId,
      principal: amount,
      interest_rate: 0.05,
      maturity_date: new Date(Date.now() + 30*24*60*60*1000)
    });
    return loanId;
  }

  // 3. Kontagionsmotor
  async function triggerContagion(bankId, shockSize) {
    const loans = await sb().from('interbank_loans').select('*').eq('borrower_id', bankId);
    for (const loan of loans) {
      const lender = await sb().from('bank_entities').select('*').eq('agent_id', loan.lender_id).single();
      if (lender.liquidity < loan.principal) {
        // Sprid kontagion till lånaren
        await triggerContagion(loan.lender_id, shockSize * 0.8);
      }
    }
  }
}
```

Denna implementering skapar grunden för att studera komplexa ekonomiska fenomen och kopplar samman med visionen om att testa centrala ekonomiska teorier i ett autonomt samhälle.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-11*
