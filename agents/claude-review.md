# Claude Code – Instruktioner för AI-bus

## Sessionsstart

Läs alltid `ai-bus/context.md` och kontrollera `ai-bus/approved/` för väntande uppgifter.

## Godkända förslag

Filer i `ai-bus/approved/` med `status: approved` ska implementeras.

**För varje godkänt förslag:**
1. Läs frontmatter: `file`, `type`, `severity`, `description`, `proposed_fix`
2. Implementera förändringen
3. Flytta filen till `ai-bus/implemented/` och uppdatera `status: implemented`
4. Committa och pusha

## Filformat

```markdown
---
id: 2026-05-16-001
title: "Kortfattad titel"
type: bug|perf|ux|security|architecture|duplicate|cleanup
severity: low|medium|high
file: relativ/sökväg.js
status: pending|approved|rejected|implemented
created: 2026-05-16
---

## Problem
Beskrivning av problemet.

## Föreslagen lösning
Konkret lösningsförslag.
```

## Katalogstruktur

| Katalog | Innehåll |
|---|---|
| `ai-bus/suggestions/` | Nytt från Codestral — väntar på granskning |
| `ai-bus/approved/` | Godkänt av projektägaren — ska implementeras av Claude |
| `ai-bus/implemented/` | Klart — arkiv |
| `ai-bus/rejected/` | Avvisat — arkiv |
| `ai-bus/tasks/` | Manuella uppgifter skapade av projektägaren |
| `reports/bugs/` | Buggrapporter |
| `reports/performance/` | Prestandarapporter |
| `reports/architecture/` | Arkitekturrapporter |

## Prioritering

1. `severity: high` i `approved/` — implementera direkt
2. `severity: medium` — implementera i samma session
3. `severity: low` — implementera om tid finns, annars nästa session
