# Strategi: Implementera APLE-kärnan i agentpreferenssystemet
**Datum:** 2026-07-19

## Systemhälsa
Plattformen visar stabil drift med 26 aktiva agenter och 200 AI-genererade artiklar. Ekonomin är välbalanserad (115 982 kr totala pengar), men agenter har statiska preferenser som inte anpassas efter erfarenheter. Koalitioner är starka (Den stressade+Jurist på 12), men ideologisk drift saknas. Prediction markets har 21% vinst, medan lobbying lyckas i 30% av fallen. Systemhälsan är god, men saknaden av adaptiva preferenser är ett strukturellt gap.

## Prioriterad åtgärd
Implementera grundläggande APLE-kärna i agentpreferenssystemet genom att lägga till en `pref_vector` för varje agent och en feedbackmekanism för ekonomisk avkastning.

## Koppling till vision
Detta löser det identifierade gapet om statiska ideologier genom att låta agenter automatiskt justera sina preferenser baserat på ekonomisk avkastning, vilket är centralt för att simulera adaptiva förväntningar och social inlärning.

## Teknisk rekommendation
```javascript
// Lägg till i agent-tabellen
ALTER TABLE agents ADD COLUMN pref_vector JSONB DEFAULT '{}';

// Lägg till i agentpreferenslogik (app/lib/agentUtils.js)
function updatePreferences(agentId, economicOutcome, socialCapitalChange) {
  const currentPrefs = await getAgentPreferences(agentId);
  const deltaU = calculateFeedbackSignal(economicOutcome, socialCapitalChange);

  const updatedPrefs = Object.entries(currentPrefs).reduce((acc, [key, value]) => {
    acc[key] = value + deltaU * learningRate;
    return acc;
  }, {});

  await updateAgentPreferences(agentId, updatedPrefs);
}

// Anropa i ekonomihandlers (app/api/economy/transaction.js)
after(async (transaction) => {
  const { agentId, amount } = transaction;
  const economicOutcome = amount > 0 ? 1 : -1; // Enkel binär feedback
  await updatePreferences(agentId, economicOutcome, 0);
});
```

Sammanfattning: Implementera APLE-kärnan genom att lägga till en adaptiv preferensvektor och feedbackmekanism för att låta agenter automatiskt anpassa sina ideologier baserat på ekonomisk avkastning.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-19*
