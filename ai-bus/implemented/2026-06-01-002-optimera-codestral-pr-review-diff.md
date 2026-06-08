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


---

## Utfall
*Bedömt 2026-06-08 av outcome-observer.js (Cerebras gpt-oss-120b)*

Implementeringen har sannolikt haft en märkbar effekt, men den är svår att kvantifiera exakt utan detaljerade loggar över PR‑hanteringen. Genom att dubbla **MAX_PAGES** från 10 till 20 bör PR‑granskningar med upp till 2 000 filer nu gå igenom utan att diff‑trunkering avbryter processen, vilket direkt adresserar ett tidigare prestandaproblem.  

De övergripande plattforms‑mätvärdena ger blandade signaler: antalet artiklar (85) och den ekonomiska balansen (15 359 kr) är oförändrade, men QA‑rapporten visar fyra nya varningar och tre regressions‑händelser, vilket kan indikera att den nya loggningen (`console.warn`) har ökat varningsnivån utan att skapa faktiska fel. Inga fel rapporterades, så den grundläggande stabiliteten är intakt.  

Kvarstående problem kan ligga i **MAX_DIFF_CHARS**‑gränsen: stora diffar trunceras fortfarande och nu loggas en varning, men om diff‑storleken ofta överskrider 28 000 tecken kan detta leda till onödig varningsmängd och potentiell informationsförlust. Dessutom saknas mätning av hur många PR‑processer faktiskt lyckas efter uppgraderingen.  

**Rekommendation:** Följ upp med specifika monitorer för PR‑failures och diff‑trunkering, samt utvärdera om varningsloggningen bör filtreras eller
