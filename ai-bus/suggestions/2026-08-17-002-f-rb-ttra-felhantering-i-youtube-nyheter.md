---
id: 2026-08-17-002
title: "Förbättra felhantering i YouTube-nyheter"
type: bug
severity: medium
risk: low
file: nyheter.py
status: pending
created: 2026-08-17
---

## Problem

hamta_youtube_nyheter misslyckas tyst om _hamta_transkript_via_vercel kastar undantag. Detta kan leda till att nyheter saknas för Kryptoanalytiker.

## Föreslagen lösning

Lägg till felhantering runt _hamta_transkript_via_vercel och returnera tom sträng. Exempel: try { return _hamta_transkript_via_vercel(video_id); } catch (e) { print(f'Transcript fetch failed: {e}', file=sys.stderr); return ''; }

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
