---
id: 2026-06-04-agent-submit-timeouts-fallbacks
title: "/api/agent/submit saknar timeouts och fullständig fallback-kedja"
type: bug
severity: high
status: rejected
risk: medium
file: app/api/agent/submit/route.js
created: 2026-06-04
rationale: "Redan implementerat. app/api/agent/submit/route.js har AI_TIMEOUT_MS = 15_000 med AbortSignal.timeout(AI_TIMEOUT_MS) på SAMTLIGA provider-fetch-anrop (Groq rad 192, Codestral/Cerebras/GitHub Models rad 219, Gemini rad 242). Gemini-fallback är redan tillagd (rad 230–254). Fallback-kedjan Groq → Codestral → Cerebras → GitHub Models → Gemini matchar och överträffar den dokumenterade artikelbedömnings-kedjan i CLAUDE.md (Groq → Codestral → Cerebras → GitHub Models). DeepSeek/Sambanova/Cloudflare ingår avsiktligt inte i denna kontext. Ingen åtgärd kvar."
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
