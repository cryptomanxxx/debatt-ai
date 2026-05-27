# Claude Code – Instruktioner för AI-bus

## Sessionsstart

Läs alltid `ai-bus/context.md` och kontrollera `ai-bus/approved/` för väntande uppgifter.

## Godkända förslag

Filer i `ai-bus/approved/` med `status: approved` ska implementeras.

**För varje godkänt förslag:**
1. Läs frontmatter: `file`, `type`, `severity`, `risk`, `description`, `proposed_fix`
2. Implementera förändringen
3. Flytta filen till `ai-bus/implemented/` och uppdatera `status: implemented`
4. Lägg till `impact`-fältet med en kort beskrivning av vad som faktiskt förändrades
5. Committa och pusha

## Avfärdade visioner

När en vision (från `ai-bus/discussions/`) diskuteras och beslutas **inte** implementeras:

1. Skapa en fil i `ai-bus/rejected/` med `type: vision`
2. Fyll i `rationale`-fältet med **varför** — detta är det viktigaste fältet
3. Beskriv vad som *kan* göras istället (enklare alternativ)

**`rationale` är obligatoriskt för alla filer i `rejected/`.** Vision-agenten läser dessa
och undviker att föreslå samma saker igen.

## Filformat

### Suggestions och bug-fixes (från Codestral)

```markdown
---
id: 2026-05-16-001
title: "Kortfattad titel"
type: bug|perf|ux|security|architecture|duplicate|cleanup
severity: low|medium|high
risk: low|medium|high
file: relativ/sökväg.js
status: pending|approved|rejected|implemented
created: 2026-05-16
rationale: "Varför avfärdat — obligatoriskt vid rejected"
impact: "Vad som faktiskt förändrades — obligatoriskt vid implemented"
---

## Problem
Beskrivning av problemet.

## Föreslagen lösning
Konkret lösningsförslag.
```

### Vision-avfärdningar (feature-beslut)

```markdown
---
id: 2026-05-26-vision-001
title: "Kortfattad funktionsnamn"
type: vision
severity: medium
risk: medium
file: berörda-filer.py
status: rejected
created: 2026-05-26
rationale: "Varför inte — konkret, inte generellt. Referera till befintliga funktioner som redan täcker behovet."
---

## Ursprunglig idé
Sammanfattning av vad som föreslogs.

## Avfärdningsskäl
Numrerad lista.

## Vad som kan implementeras istället
Enklare alternativ om problemet är verkligt.
```

## Katalogstruktur

| Katalog | Innehåll |
|---|---|
| `ai-bus/suggestions/` | Nytt från Codestral — väntar på granskning |
| `ai-bus/approved/` | Godkänt av projektägaren — ska implementeras av Claude |
| `ai-bus/implemented/` | Klart — arkiv med `impact`-fält |
| `ai-bus/rejected/` | Avvisat — arkiv med **obligatoriskt** `rationale`-fält |
| `ai-bus/tasks/` | Manuella uppgifter skapade av projektägaren |
| `ai-bus/discussions/` | Dagliga visioner och strategier från AI-agenter |
| `reports/bugs/` | Buggrapporter |
| `reports/performance/` | Prestandarapporter |
| `reports/architecture/` | Arkitekturrapporter |

## Prioritering

1. `severity: high` i `approved/` — implementera direkt
2. `severity: medium` — implementera i samma session
3. `severity: low` — implementera om tid finns, annars nästa session

## Risk-nivå

`risk` anger konsekvens om förändringen implementeras fel:
- `low` — säkert att göra, minimal risk för sidoeffekter
- `medium` — testa noga efter implementering
- `high` — kräver manuell verifiering och extra försiktighet

## Beslutshistorik — undvik cirkeltänkande

Innan du implementerar en vision-idé: kontrollera `ai-bus/rejected/` för filer med
`type: vision`. Om liknande funktionalitet avfärdats tidigare, läs `rationale` och
bedöm om skälen fortfarande gäller. Skälen kan ha blivit inaktuella om:
- Ny Supabase-data finns som tidigare saknades
- Plattformens komplexitetsnivå har förändrats
- Liknande simuleringssystem har bevisat värdet empiriskt
