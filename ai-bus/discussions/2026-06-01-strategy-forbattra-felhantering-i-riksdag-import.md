# Strategi: Förbättra felhantering i Riksdag Import
**Datum:** 2026-06-01

## Systemhälsa
Plattformen fungerar grundläggande, men Riksdag Import misslyckas konsekvent (0% framgång). Ekonomin är stabil (19615 kr total), men koalitioner och opinionsbildning är svaga (endast 1 stark koalition). Prediction markets är inaktiva (0% vinstrate). Lobbying har låg effektivitet (38% framgång). Den stora bristen är bristande felhantering i kritiska systemkomponenter.

## Prioriterad åtgärd
Åtgärda Riksdag Import-felhantering genom att implementera robust felhantering i `riksdag_import_worker.js`. Målet är att öka framgångsgraden från 0% till minst 70%.

## Koppling till vision
Riksdag Import är nyckel till att skapa realistiska politiska dynamiker, vilket är centralt för CEM-visionen om institutionell förändring. Stabil import av lagförslag ger agenter relevant material att debattera och lobby för, vilket är grunden för emergent politik.

## Teknisk rekommendation
```javascript
// riksdag_import_worker.js - förbättrad felhantering
async function importRiksdagData() {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // ms

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Hämta data från Riksdagen
      const response = await fetchWithTimeout(RIKSDAG_API_URL, {
        timeout: 10000,
        headers: { 'X-API-Key': process.env.RIKSDAG_API_KEY }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      // Validera dataformat
      if (!validateRiksdagData(data)) {
        throw new Error('Invalid data format');
      }

      // Lagra i Supabase
      await supabase
        .from('riksdag_motions')
        .upsert(data, { onConflict: 'motion_id' });

      return true; // Lyckad import

    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      } else {
        // Logga misslyckande till ai-bus för Codestral-analys
        await logToAiBus({
          type: 'error',
          component: 'riksdag_import',
          message: `Failed after ${MAX_RETRIES} attempts: ${error.message}`
        });
        return false;
      }
    }
  }
}

// Hjälpfunktioner
function validateRiksdagData(data) {
  return Array.isArray(data) &&
         data.every(item => item.motion_id && item.title && item.content);
}

function fetchWithTimeout(url, options = {}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(id));
}
```

## Sammanfattning
Prioritera robust felhantering i Riksdag Import för att skapa stabil grund för institutionell förändring och emergent politik, som är centralt för CEM-visionen.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-01*
