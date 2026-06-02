---
id: 2026-05-25-001
title: "Groq rate-limit hantering"
type: bug
severity: high
risk: medium
file: ai_klient.py
status: rejected
created: 2026-05-25
rejected: 2026-06-02
rationale: "Återinlämnad dubblett av rejected/2026-05-25-001-groq-nere-reset.md. _nere är en module-level set som nollställs varje ny Python-process — GitHub Actions startar ett nytt process per körning, så ingen status överlever mellan körningar. En TPD-gräns återhämtar sig inte inom en körnings minuter. Dessutom är pseudokoden felaktig: _nere['groq'] och _nere.remove('groq') förutsätter en dict, men _nere är ett set. Ingen åtgärd behövs."
---

## Problem

Groq API:n har en dagsgräns (TPD) som inte hanteras korrekt. När den nås markeras Groq som nere, men det finns ingen återställning av statusen. Detta leder till att alla efterföljande anrop till Groq misslyckas.

## Föreslagen lösning

Lägg till en återställningsmekanism för Groq-statusen. Till exempel en tidsgräns (12 timmar) för hur länge Groq ska markeras som nere. Pseudokod: if 'groq' in _nere and time.time() - _nere['groq'] > 43200: _nere.remove('groq')

## Avfärdningsskäl

1. `_nere` är ett module-level `set` (`ai_klient.py:18`) som lever bara så länge processen lever. Varje GitHub Actions-körning är ett nytt Python-process → `_nere` är tomt vid start. Det finns inget persistent state att återställa.
2. En körning varar minuter; en TPD-gräns (tokens per dag) återhämtar sig inte inom den tiden. Att markera Groq som nere för resten av körningen är därför korrekt beteende, inte en bugg.
3. Den föreslagna koden är trasig: `_nere['groq']` och `_nere.remove('groq')` antar att `_nere` är en `dict` med tidsstämplar, men det är ett `set` — koden skulle kasta `TypeError`.
