---
id: 2026-06-01-002
title: Optimera Codestral PR-review diff-hämtning
type: perf
severity: medium
risk: low
file: agents/codestral-pr-review.js
status: implemented
created: 2026-06-01
implemented: 2026-06-01
impact: MAX_PAGES höjt från 10→20 (täcker upp till 2000 filer), console.warn loggas när diffen trunkeras pga storleksgräns
---

## Åtgärd

- `MAX_PAGES` höjt från 10 till 20 — PR:ar med upp till 2 000 filer hanteras nu korrekt
- `console.warn` läggs till när diffen trunkeras pga `MAX_DIFF_CHARS`-gränsen, synligt i GitHub Actions-loggen
- `MAX_DIFF_CHARS`-logiken (28 000 tecken) var redan korrekt — ingen ändring behövdes där
