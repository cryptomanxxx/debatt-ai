---
id: 2026-06-04-analyze-api-validation
title: "/api/analyze tar emot rå messages-array och vidarebefordrar direkt till Groq"
type: security
severity: high
status: implemented
risk: medium
file: app/api/analyze/route.js
created: 2026-06-04
impact: "Lade till IP-rate-limit (checkRateLimit, 5/timme), strukturvalidering av messages-arrayen (1–4 meddelanden, content måste vara icke-tom sträng), totallängdstak (12 000 tecken), AbortSignal.timeout(20000) på Groq-anropet och res.ok-kontroll som returnerar 502. AVVEK MEDVETET från förslagets kontraktsbyte ({title,author,text}): båda klienterna (app/client.js, app/skicka-in/SkickaInClient.js) skickar messages med SYSTEM_PROMPT byggd klientsidan — att byta kontrakt hade krävt att flytta SYSTEM_PROMPT serverside och ändra två klienter, vilket är bredare än en fokuserad ändring. Validering inom befintligt kontrakt täcker de faktiska säkerhetshålen (obegränsad input, ingen rate-limit, ingen res.ok)."
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
