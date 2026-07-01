---
id: 2026-06-29-002
title: "Förbättra felhantering i agent.py"
type: bug
severity: high
risk: medium
file: agent.py
status: rejected
created: 2026-06-29
rejected: 2026-07-01
rationale: "Föreslår ett API som inte finns. agent.py anropar inte 'ai_klient.anrop(prompt, timeout=10)' — all LLM-användning går via hamta_kort_fns()/hamta_artikel_fns() i ai_klient.py, som redan har per-provider timeout (60s, ai_klient.py rad 205-405), try/except per provider, _nere-spårning och en full fallback-kedja Groq→Gemini→GitHub Models→... 'fallback_svar()' finns inte och behövs inte — vid total provider-fallissemang returnerar kedjan tom sträng som anroparna redan hanterar. Att hårdkoda ett direkt providernanrop skulle bryta CLAUDE.md-regeln (lint-provider-usage.yml)."
---

## Problem

agent.py har många onedliga felhanteringsblock som bara loggar fel utan att hantera dem. Speciellt i AI-klientanropen där det saknas timeout-hantering.

## Föreslagen lösning

Lägg till timeout-hantering och felåterställning för AI-anrop. Pseudokod:

```python
try:
    response = ai_klient.anrop(prompt, timeout=10)
except TimeoutError:
    logga_fel('AI-anrop timeout')
    return fallback_svar()
except Exception as e:
    logga_fel(f'AI-anrop misslyckades: {str(e)}')
    return fallback_svar()
```

## Avfärdningsskäl

1. **Föreslaget API existerar inte:** Det finns ingen `ai_klient.anrop()` eller `fallback_svar()`. agent.py använder `hamta_kort_fns()`/`hamta_artikel_fns()` som returnerar en lista `(provider, fn)`-par att iterera över tills en lyckas.
2. **Timeout finns redan:** Varje provider-anrop i `ai_klient.py` har `timeout=60` (rad 205-405) och try/except; `_nere`/`_groq_nere_keys` hindrar upprepade anrop till nedgångna providers.
3. **Fallback är själva designen:** Kedjan Groq→Gemini→GitHub Models→Cerebras→... hanterar redan enskilda providerfel. Vid total fallissemang returneras tom sträng, som anropande kod hanterar.
4. **Skulle bryta arkitekturregeln:** Ett direkt providernanrop utanför `ai_klient.py` failar `lint-provider-usage.yml` (se CLAUDE.md).
