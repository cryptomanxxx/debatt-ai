---
id: 2026-06-15-005
title: "Optimera ekonomianalysens datahämtning"
type: perf
severity: medium
risk: low
file: agents/economy-observer.js
status: rejected
created: 2026-06-15
rejected: 2026-07-01
rationale: "Direkt dubblett av redan avfärdade 2026-06-01-003. economy-observer.js skickar redan BERÄKNADE nyckeltal (Gini, topp-3, veckoskatter m.m.) till Cerebras — inte råa Supabase-rader. httpGet har 10s timeout och returnerar [] vid fel (rad 42-59). Alla queries har redan smala select= och limit=. Det finns inget dokumenterat fall av 'överskriden payload-gräns' — premissen är hypotetisk."
---

## Problem

economy-observer.js hämtar onödigt mycket data från Supabase och skapar stora JSON-payloads som överskrider Cerebras API:s begränsningar. Detta leder till misslyckade analyser.

## Föreslagen lösning

Implementera selektiv datahämtning baserat på aktuella ekonomiska händelser. Komprimera data innan skickande till Cerebras. Lägg till validering av payload-storlek.

## Avfärdningsskäl

1. **Skickar redan aggregat, inte rådata:** Scriptet beräknar nyckeltal (Gini, förmögenhetskoncentration, veckoskatter, börsomsättning) och skickar dessa kompakta tal till Cerebras — råa Supabase-rader lämnar aldrig scriptet.
2. **Smala queries redan:** Alla Supabase-anrop använder riktade `select=`-fält och `limit=`.
3. **Timeout/fel hanterat:** `httpGet` har 10s timeout och returnerar `[]` (rad 42-59); `arr()`-wrappern säkrar tomma listor.
4. **Hypotetisk premiss:** Inget verkligt fall av överskriden payload-gräns är dokumenterat. Redan avfärdat 2026-06-01-003.
