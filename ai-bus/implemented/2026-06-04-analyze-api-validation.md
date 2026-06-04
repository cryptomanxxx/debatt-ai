---
id: 2026-06-04-analyze-api-validation
title: "/api/analyze tar emot rå messages-array och vidarebefordrar direkt till Groq"
type: security
severity: high
status: implemented
risk: medium
file: app/api/analyze/route.js
created: 2026-06-04
impact: "Härdade /api/analyze inom befintligt messages-kontrakt (klientändringar undveks): validering av messages-array (1–4 element, content måste vara string), total contentlängd cappad till 12000 tecken (413 vid överskridande), IP-rate-limit 5/timme via checkRateLimit, AbortSignal.timeout(20000) på Groq-anropet samt res.ok-kontroll med 502-svar. try/catch på request.json(). Full kontraktsomskrivning (messages → {title,author,text}) sköts upp som större refaktor som kräver ändring av två klienter."
---

## Problem

`/api/analyze` accepterar en `messages`-array från klienten och skickar den direkt till Groq
efter Turnstile-verifiering. Det saknas:

1. Schema-validering — klienten styr hela prompt-strukturen.
2. Maxlängd per meddelande — obegränsad input kan tömma Groq rate-limit.
3. IP-rate-limit utöver Turnstile.
4. `res.ok`-kontroll på Groq-svaret.

Effekt: en angripare som löser Turnstile (billigt via manuell tjänst ~$0.001/st) kan pumpa
godtyckliga prompts mot Groq via plattformens API-nyckel.

## Föreslagen lösning

Ändra kontraktet: ta emot `{ title, author, text }` i stället för `messages`.
Bygg prompten server-side. Validera längder (text max 8 000 tecken).
Lägg IP-rate-limit 5 anrop/timme via `checkRateLimit`.
Lägg `AbortSignal.timeout(20_000)` på Groq-anropet och returnera 502 om det felar.
