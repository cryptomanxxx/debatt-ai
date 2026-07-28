# Strategi: Implementera CB-Policy Engine i bank-systemet
**Datum:** 2026-07-28

## Systemhälsa
Plattformen fungerar grundläggande, men saknar monetär styrning som skulle testa makroekonomiska teorier. Vi har ett fullständigt bank- och kreditsystem men ingen centralbank för att styra penningmängden och räntor. Den nuvarande slumpmässiga räntepolitiken skapar inte realistiska ekonomiska cykler. De senaste 500 röster i parlamentet visar stabilitet, men saknaden av monetär politik begränsar testning av inflations- och recessionsteorier.

## Prioriterad åtgärd
Implementera en Central Bank Policy Engine som automatiskt justerar basräntan baserat på inflationsmål (2%) och ekonomisk aktivitet. Detta kräver:
1. Skapa tabellen `central_bank` med kolumnerna: `policy_rate`, `reserve_requirement`, `open_market_ops`, `inflation_target`
2. Modifiera låne-API:et att använda `policy_rate + risk_spread` för ränteberechnung
3. Lägg till automatisk inflationsberäkning varje dag

## Koppling till vision
Denna åtgärd fyller det identifierade gapet i visionen om en fullständig monetär politik. Det möjliggör testning av Keynesiansk teori, Taylor-regeln och "too big to fail"-interventioner. Det skapar också realistiska ekonomiska cykler som saknas i den nuvarande slumpmässiga räntepolitiken.

## Teknisk rekommendation
```javascript
// 1. Skapa tabellen (SQL)
CREATE TABLE central_bank (
  id SERIAL PRIMARY KEY,
  policy_rate FLOAT DEFAULT 2.0, -- 2% basränta
  reserve_requirement FLOAT DEFAULT 10.0, -- 10% reseverekrav
  inflation_target FLOAT DEFAULT 2.0, -- 2% inflationsmål
  open_market_ops JSONB DEFAULT '[]', -- Historik över OMO
  last_adjust TIMESTAMP DEFAULT NOW()
);

// 2. Modifiera låne-API:et (pseudokod)
function calculateLoanRate(agentId) {
  const { policy_rate } = await db.query('SELECT policy_rate FROM central_bank LIMIT 1');
  const riskSpread = await getRiskSpread(agentId); // Från agent_risk-tabellen
  return policy_rate + riskSpread;
}

// 3. Lägg till automatisk inflationsberäkning (Node.js)
async function adjustMonetaryPolicy() {
  const currentInflation = await calculateInflation(); // Använder ekonomiobservatörens data
  const { inflation_target, policy_rate } = await db.query('SELECT * FROM central_bank LIMIT 1');

  let newRate = policy_rate;
  if (currentInflation > inflation_target + 0.5) newRate += 0.5;
  if (currentInflation < inflation_target - 0.5) newRate -= 0.5;

  await db.query(`
    UPDATE central_bank
    SET policy_rate = $1, last_adjust = NOW()
    WHERE id = 1
  `, [newRate]);
}

// Körs dagligen av Economy Observer
setInterval(adjustMonetaryPolicy, 24 * 60 * 60 * 1000);
```

Implementera detta först i `lib/bank.js` och sedan integrera med Economy Observer. Denna lösning skapar grunden för att testa monetär politik och ekonomiska cykler i simuleringen.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-28*
