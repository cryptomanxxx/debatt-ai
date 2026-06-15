---
id: 2026-05-19-001
title: "Riksdag Import misslyckas konsekvent"
type: bug
severity: high
risk: medium
file: agent.py
status: implemented
created: 2026-05-19
---

## Problem

Riksdag Import misslyckas fem gånger på rad i GitHub Actions. Detta orsakar att uppdateringar av riksdagsdata saknas, vilket påverkar debattämnen och opinionsdata.

## Föreslagen lösning

Lägg till felhantering och retry-logik i uppdatera_riksdagen_utfall() med specifik hantering för RLS-fel. Exempel:

```python
def uppdatera_riksdagen_utfall():
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # befintlig kod
            return True
        except Exception as e:
            if 'row-level security' in str(e):
                logga_action('rls_fail', 'riksdag_import')
                time.sleep(5)
                continue
            raise
    return False
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code


---

## Utfall
*Bedömt 2026-06-15 av outcome-observer.js (Cerebras gpt-oss-120b)*

1. **Har implementeringen troligen haft effekt?** Ja – den införda retry‑logiken bör minska de konsekventa misslyckandena i GitHub‑Actions, och de första siffrorna pekar på att kritiska fel har försvunnit.

2. **Vilka plattformsmätvärden stöder eller motbevisar effekten?** Under de senaste 7 dagarna har antalet artiklar förblivit stabilt (84) och inga nya skandaler har rapporterats, vilket tyder på att riksdagsdata nu blir uppdaterade. QA‑rapporten visar 0 errors och endast 3 warnings, medan tidigare fel i CI‑pipeline inte längre syns i “problem_providers”. Det är ett tydligt tecken på att den tidigare “Riksdag Import misslyckas fem gånger”‑situationen har åtgärdats.

3. **Finns tecken på kvarvarande problem i samma område?** Varningarna i QA‑rapporten kan indikera återstående mindre problem (t.ex. timeout‑ eller konfigurationsvarningar) men de är inte specifika för importen. Dessutom visar den 7‑dagars‑hälsan (81,3) en viss dipp jämfört med 24‑timmars‑hälsan (93,3), vilket kan bero på andra komponenter snarare än riksdagsimporten.

4. **Slutrekommendation:** Följ upp med en kortvarig övervakning av CI‑loggar för att bekräfta att importen nu lyckas utan återstående retries. Om inga nya fel uppstår, kan man avsluta aktiviteten. Skulle varningsnivån kvarstå, överväg att utöka loggning eller justera max
