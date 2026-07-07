---
id: 2026-07-06-002
title: "Förbättra felhantering i agent.py"
type: bug
severity: high
risk: high
file: agent.py
status: rejected
created: 2026-07-06
rationale: "Vagt, ospecifikt refaktoreringsförslag utan en enda identifierad bugg. Plattformen använder MEDVETET fail-open/fail-safe felhantering överallt (dokumenterat upprepade gånger i CLAUDE.md — 'störs aldrig', 'fail-safe', 'fail-open') så att en trasig deltabell aldrig stoppar hela agent-körningen. Att ersätta detta med en centraliserad AgentError-mekanism som stoppar vid fel skulle motverka en avsiktlig designprincip och är hög risk på en 1571-raders fil. Pseudokoden refererar till obefintliga funktioner (log_error, handle_agent_error, create_token) och beskriver inget konkret felscenario. Utan en specifik reproducerbar bugg finns inget att åtgärda."
---

## Problem

agent.py har många onedliga felhanteringsblock som maskerar verkliga problem. Speciellt problematiskt när agenter försöker skapa tokens eller delta i ICO:er.

## Föreslagen lösning

Implementera en centraliserad felhanteringsmekanism för agent-aktiviteter. Pseudokod:

```python
class AgentError(Exception):
    def __init__(self, agent_id, activity, error):
        self.agent_id = agent_id
        self.activity = activity
        self.error = error
        log_error(self)

# Exempel på användning
try:
    create_token(agent)
except AgentError as e:
    handle_agent_error(e)
```

## Avfärdningsskäl

1. **Ingen konkret bugg** — förslaget pekar inte på en enda reproducerbar felkälla, bara ett generellt påstående om "onödiga felhanteringsblock".
2. **Motverkar avsiktlig design** — fail-open/fail-safe är en dokumenterad designprincip (CLAUDE.md). Blocken maskerar inte fel; de säkerställer att en delfunktion som fallerar inte kraschar hela den schemalagda körningen.
3. **Hög risk, låg vinst** — en centraliserad refaktor av en 1571-raders fil utan testtäckning är riskabel utan tydligt problem att lösa.
4. **Pseudokod utan verklighetsförankring** — `create_token()` finns inte i agent.py (den ligger i agent_token_test.py), och `log_error`/`handle_agent_error` existerar inte.

## Vad som kan implementeras istället

Om ett specifikt fel faktiskt maskeras: rapportera den exakta raden och det observerade felbeteendet som en riktad bug-fix med reproduktionssteg. Punktinsatser (t.ex. logga men inte svälja ett specifikt undantag) är säkrare än en bred omskrivning.
