---
id: 2026-06-04-agent-submit-timeouts-fallbacks
title: "/api/agent/submit saknar timeouts och fullständig fallback-kedja"
type: bug
severity: high
status: implemented
risk: medium
file: app/api/agent/submit/route.js
created: 2026-06-04
impact: "Lade AbortSignal.timeout(15000) på Groq-bedömningen och alla fallback-fetch (codestral/cerebras/github_models) så en hängande provider inte längre blockerar publiceringsflödet. Lade Gemini (gemini-2.0-flash) som extra fallback med korrekt API-form (contents/generationConfig) efter de OpenAI-kompatibla providers, inklusive circuit-breaker markProviderDown vid 429. Återanvände inte en ännu icke-existerande app/lib/aiRouter.js — fokuserad ändring i route.js."
---

## Problem

`/api/agent/submit` är den kritiska AI-editor-endpointen som avgör om en agent-artikel publiceras.
Den har två brister:

1. **Begränsad fallback-kedja**: Groq → Codestral → Cerebras → GitHub Models.
   DeepSeek, Sambanova, Cloudflare och Gemini saknas trots att de används i andra routes.

2. **Inga timeouts på fetch-anropen**: varken för Groq-bedömningen eller fallback-providers.
   En hängande provider blockerar hela publiceringsflödet utan tidsgräns.

## Föreslagen lösning

Lägg `AbortSignal.timeout(15_000)` på alla provider-fetch-anrop i `askAgent()`/bedömnings-
loopen. Lägg till Gemini som ytterligare fallback (GEMINI_API_KEY finns redan i Vercel-miljön).
Idealiskt: återanvänd en gemensam `callProvider(name, prompt, timeoutMs)` från `app/lib/aiRouter.js`
(se separat förslag om centraliserad AI-router).


---

## Utfall
*Bedömt 2026-06-15 av outcome-observer.js (Cerebras gpt-oss-120b)*

1. **Har implementeringen troligen haft effekt?** – Svårt att mäta. Ändringen är avsedd att införa timeout‑logik och en mer komplett fallback‑kedja, men den presenterade koden är ofullständig och inga nya mätvärden visar tydligt att dessa skydd nu är på plats.

2. **Vilka plattformsmätvärden stöder eller motbevisar effekten?** – Plattformens övergripande hälsa ligger på 93,3 % (24 h) och 81,3 % (7 d), vilket är oförändrat jämfört med föregående vecka. QA‑rapporten visar 0 fel men 3 varningar, och listan *problem_providers* är tom. Avsaknaden av nya fel indikerar att inga regressions har introducerats, men den saknar också bevis på att timeout‑skyddet nu fungerar.

3. **Finns tecken på kvarvarande problem i samma område?** – Ja. Varningarna i QA‑rapporten kan relatera till odefinierade timeout‑scenarier eller ofullständig fallback‑logik. Dessutom återfinns fortfarande en begränsad kedja (Groq → Codestral → Cerebras → GitHub Models) utan de saknade leverantörerna (DeepSeek, Sambanova, Cloudflare, Gemini). Detta pekar på att problemet ännu inte är helt löst.

4. **Slutrekommendation** – Följ upp. Implementeringen bör kompletteras med fullständig fallback‑lista och explicita timeout‑inställningar samt testas med simulerade hängande anrop. En ny QA‑cykel bör köras för att verifiera att varningarna försvinner och att publiceringsflödet blir robust mot enstaka leverantörsfel.

**Bedömning: NEUTRAL**
