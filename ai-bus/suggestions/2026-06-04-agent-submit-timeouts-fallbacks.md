---
id: 2026-06-04-agent-submit-timeouts-fallbacks
title: "/api/agent/submit saknar timeouts och fullständig fallback-kedja"
type: bug
severity: high
status: pending
risk: medium
file: app/api/agent/submit/route.js
created: 2026-06-04
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
