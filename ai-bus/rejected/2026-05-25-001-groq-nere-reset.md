---
id: 2026-05-25-001
title: Groq rate-limit hantering
type: bug
severity: high
risk: medium
file: ai_klient.py
status: rejected
created: 2026-05-25
rejected: 2026-06-01
rationale: _nere är en module-level set i Python — den resettas automatiskt varje gång GitHub Actions startar ett nytt Python-process. Inget persistent state mellan körningar. Ingen åtgärd behövs.
---
