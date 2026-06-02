---
id: 2026-06-01-001
title: "Token ICO-funktion misslyckas ofta"
type: bug
severity: medium
risk: medium
file: agent_token_test.py
status: rejected
created: 2026-06-01
rejected: 2026-06-02
rationale: "Återinlämnad dubblett av rejected/2026-06-01-001-token-ico-retry.md. _llm() har redan en Groq→Gemini→GitHub Models-fallbackkedja med try/except per provider, och varje HTTP/Supabase-anrop har timeout=8 + try/except. Den föreslagna koden refererar funktioner som inte finns (make_ico_request, APIError). '~30%-felfrekvensen' är obestyrkt — tokenskapande triggas bara med 3% chans per analytiker per körning. Ingen tydlig bugg att åtgärda."
---

## Problem

ICO-processen misslyckas ofta på grund av timeout eller API-fel, vilket leder till att tokens inte noteras på börsen. Detta händer i ~30% av körningarna enligt weekly digest.

## Föreslagen lösning

Implementera retry-logik med exponeriell backoff för API-anrop och lägg till timeout-hantering.

## Avfärdningsskäl

1. `_llm()` (`agent_token_test.py:72-90`) har redan en 3-providers fallbackkedja (Groq → Gemini → GitHub Models) med try/except per provider.
2. Alla Supabase-anrop har `timeout=8` och är inneslutna i try/except med loggning (rad 94-172, 252-281, 289-348).
3. `ico_avsluts_runda()` hanterar redan 409 (token finns redan) korrekt (rad 389).
4. Den föreslagna pseudokoden refererar `make_ico_request()` och `APIError` som inte finns i kodbasen — kan inte implementeras som beskrivet.
5. Tokenskapande är gated på `random.random() > 0.03` per analytiker (rad 216) — de flesta körningar skapar ingen token alls, så "~30% misslyckas" speglar inte ett verkligt fel.
