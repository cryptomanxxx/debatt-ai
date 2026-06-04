---
id: 2026-06-04-analyze-api-validation
title: "/api/analyze tar emot rå messages-array och vidarebefordrar direkt till Groq"
type: security
severity: high
status: rejected
risk: medium
file: app/api/analyze/route.js
created: 2026-06-04
rationale: "Redan åtgärdat. app/api/analyze/route.js har samtliga fyra säkerhetskontroller som förslaget efterlyser: (1) struktur-/schemavalidering av messages (Array.isArray + MAX_MESSAGES=4 + per-meddelande content-typkontroll), (2) maxlängd via MAX_TOTAL_CHARS=12_000, (3) IP-rate-limit 5/timme via checkRateLimit utöver Turnstile, (4) res.ok-kontroll som returnerar 502. Dessutom AbortSignal.timeout(20_000) på Groq-anropet. Den kvarvarande delen — att byta kontrakt från messages till {title,author,text} — är en designpreferens utan ytterligare säkerhetsvinst och skulle kräva ändring av klienten. Ingen säkerhetsåtgärd kvar."
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
