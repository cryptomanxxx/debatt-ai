---
id: 2026-06-22-003
title: "Optimera Codestral-arbetsflöde"
type: perf
severity: medium
risk: low
file: agents/codestral-worker.js
status: rejected
created: 2026-06-22
rejected: 2026-07-01
rationale: "En cache för en veckovis engångsanalys ger inget värde — worker körs en gång/vecka på filer ändrade sedan förra körningen, så samma kodblock analyseras aldrig två gånger. Kodbasstorleken är redan hårt begränsad: max 50 filer, 3000 tecken/fil, MAX_CHARS_TOTAL=40000 (rad 21-23, 133-135). 'Gradvis filbehandling', 'progress-indikatorer' och 'minnesoptimering' adresserar inte något faktiskt problem för denna lilla, sällan körda job."
---

## Problem

codestral-worker.js har ineffektiv hantering av stora kodbaser och saknar cache för återkommande analyser.

## Föreslagen lösning

Implementera en cache för Codestral-analyser och optimera filbehandling. Pseudokod: 1. Lägg till en cache för Codestral-analyser 2. Implementera en gradvis filbehandlingsstrategi 3. Lägg till progress-indikatorer för stora analyser 4. Optimera minnesanvändning för stora kodbaser

## Avfärdningsskäl

1. **Cache saknar nytta:** Workern körs veckovis på *ändrade* filer (`getChangedFiles`, `--since`), så "återkommande analyser" av samma kodblock uppstår inte.
2. **Storlek redan begränsad:** `MAX_FILES=50`, 3000 tecken/fil och `MAX_CHARS_TOTAL=40000` (rad 21-23, 133-135) håller payloaden liten. Ingen "stor kodbas" når LLM:en.
3. **Ingen minnesrisk:** Jobbet läser små filbitar sekventiellt; minnesoptimering är onödig.
