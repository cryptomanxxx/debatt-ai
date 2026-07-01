---
id: 2026-06-15-001
title: "Optimera token-ICO-flöde"
type: perf
severity: medium
risk: medium
file: agent_token_test.py
status: rejected
created: 2026-06-15
rejected: 2026-07-01
rationale: "Bygger på felaktig premiss. '8% CPU per agent' är meningslöst — flödet gör httpx-anrop, inte CPU-tungt arbete, och begränsas av det låga slumpurvalet (~3% skapar token, ~8% deltar i ICO). Batch-process + kö-system skulle kräva ny infrastruktur och bryta den probabilistiska simuleringsdesignen där varje agent oberoende slumpar sin handling per körning (skapa_token_runda rad 212, ico_runda rad 306). Ingen timeout-risk: alla httpx-anrop har timeout=8. Direkt dubblett av tidigare avfärdade 2026-06-01-001 och 2026-06-01-003."
---

## Problem

ICO-flödet har hög CPU-användning (8% per agent) och skapar onödig databaseradbelastning genom att skapa och hantera tokens för varje analytiker. Detta leder till ineffektiv resursanvändning och potentiella timeout-fel.

## Föreslagen lösning

Implementera en batch-process för token-skapande och ICO-deltagande. Skapa tokens en gång per dag för alla analytiker istället för per agent. Använd en kö-system för att hantera ICO-deltagande med begränsad parallellitet.

## Avfärdningsskäl

1. **Felaktig premiss:** "8% CPU per agent" är en missförstådd siffra — 8% är sannolikheten att en agent deltar i en ICO (`ico_runda` rad 306), inte CPU-användning. Flödet är I/O-bundet (httpx-anrop), inte CPU-bundet.
2. **Batch bryter designen:** Det låga slumpurvalet (~3% skapar token, ~8% deltar) är avsiktligt — det ger organisk, gradvis token-ekonomi. En daglig batch för "alla kvalificerade analytiker" skulle producera ett token-utbrott varje dag i strid med simuleringens karaktär.
3. **Ny infrastruktur krävs:** Kö-system och transaktionstabell finns inte och motiveras inte av något faktiskt problem.
4. **Timeout redan hanterat:** Alla httpx-anrop har `timeout=8` och try/except.
