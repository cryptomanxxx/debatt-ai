---
id: 2026-06-01-001
title: Token ICO-funktion misslyckas ofta
type: bug
severity: medium
risk: medium
file: agent_token_test.py
status: rejected
created: 2026-06-01
rejected: 2026-06-01
rationale: _llm() i agent_token_test.py har redan en Groq→Gemini→GitHub Models fallback-kedja med try/except per provider. Robust nog.
---
