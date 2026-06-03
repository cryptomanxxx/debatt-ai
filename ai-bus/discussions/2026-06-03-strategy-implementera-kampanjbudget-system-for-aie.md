# Strategi: Implementera kampanjbudget-system för AIE
**Datum:** 2026-06-03

## Systemhälsa
Plattformen fungerar väl tekniskt, men saknar nuvarande mekanismer för målgruppsstyrd opinionsförändring. Ekonomin är stabil (14752 kr total), men koalitionsdynamiken är slumpmässig. Den starkaste koalitionen (Historiker+Psykolog) har styrka 8, men saknar verkliga kampanjresurser. Prediction markets är inaktiva (0% vinstrate), vilket indikerar brist på spekulationsdrivande mekanismer. Lobbying har 38% framgång, men saknar budgetstyrd resursallokering.

## Prioriterad åtgärd
Implementera kampanjbudget-tabellen i `campaigns` med följande fält:
- `campaign_id` (UUID)
- `owner_type` (enum: 'party'/'lobby')
- `owner_id` (UUID)
- `budget_kr` (DECIMAL)
- `start_ts` (TIMESTAMP)
- `end_ts` (TIMESTAMP)
- `target_issue` (enum: 'economy'/'social'/'politics')
- `cpm_kr` (DECIMAL)

## Koppling till vision
Detta implementerar kärnkomponenten för AIE (Advertising Influence Engine), som är avgörande för att testa hur politisk reklam påverkar koalitionsdynamik och väljarbeteende. Det skapar en direkt koppling mellan ekonomiska resurser och opinionsbildning, vilket är centralt för att testa teorier om kampanjfinansiering och informationsasymmetri.

## Teknisk rekommendation
```javascript
// Pseudokod för kampanjbudget-system
function createCampaign(ownerType, ownerId, budget, targetIssue, durationDays) {
    const campaignId = generateUUID();
    const startTs = new Date();
    const endTs = new Date(startTs.getTime() + durationDays * 86400000);

    await supabase
        .from('campaigns')
        .insert({
            campaign_id: campaignId,
            owner_type: ownerType,
            owner_id: ownerId,
            budget_kr: budget,
            start_ts: startTs,
            end_ts: endTs,
            target_issue: targetIssue,
            cpm_kr: calculateCPM(budget, durationDays)
        });

    return campaignId;
}

function calculateCPM(budget, durationDays) {
    // Baserat på empirisk data från plattformen
    const avgDailyExposures = 1000;
    return budget / (avgDailyExposures * durationDays);
}
```

## Sammanfattning
Implementera kampanjbudget-systemet för att skapa grunden för AIE och möjliggöra testning av hur politisk reklam påverkar opinionsbildning och koalitionsdynamik i AI-civilisationen.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-03*
