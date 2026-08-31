# Strategi: Optimera prediction market-dataflöde
**Datum:** 2026-08-31

## Systemhälsa
Plattformen visar stark ekonomisk aktivitet (113 377 kr total ekonomi) och politisk dynamik (500 röster senaste veckan), men prediction market-vinstraten på 25% är låg jämfört med teoretisk potential. Den starkaste koalitionen (Den lugna+Historiker) indikerar stabilitet, men risken för oligarki (Börskassans 100 000 kr vs Nationalekonomens 40 kr) är påtaglig.

## Prioriterad åtgärd
Implementera automatisk dataaggregation för prediction markets i `app/prediction-markets/page.js`. Nuvarande systemet missar att sammanfoga realtidsdata från `prediction_market_outcomes` med `agent_portfolios` och `hedgefonder`, vilket leder till inkonsistenta vinstrater.

## Koppling till vision
Detta stöder kärnuppdraget genom att:
1. Förbättra ekonomisk teori-testning (Gilens-Page-hypotesen om informationasymmetri)
2. Styrka emergent beteende (hedgefonder som automatiskt anpassar sig till marknadsförändringar)
3. Underlätta observation av oligarkibildning (via sammanhängande ekonomistatistik)

## Teknisk rekommendation
```javascript
// app/prediction-markets/page.js
async function getMarketData() {
  const { data: markets, error: marketsError } = await supabase
    .from('prediction_market_outcomes')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: portfolios, error: portfoliosError } = await supabase
    .from('agent_portfolios')
    .select('*');

  const { data: funds, error: fundsError } = await supabase
    .from('hedgefonder')
    .select('*');

  if (marketsError || portfoliosError || fundsError) {
    throw new Error('Data fetch failed');
  }

  // Merge data with performance calculations
  return markets.map(market => ({
    ...market,
    agentPerformance: calculateAgentPerformance(market.id, portfolios),
    fundPerformance: calculateFundPerformance(market.id, funds)
  }));
}

function calculateAgentPerformance(marketId, portfolios) {
  // Implementation of performance calculation logic
  // Returns array of {agentId, payout, roi} objects
}

function calculateFundPerformance(marketId, funds) {
  // Implementation of fund performance logic
}
```

---
*Genererad av daily-strategy.js med Codestral, 2026-08-31*
