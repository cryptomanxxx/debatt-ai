---
id: 2026-08-17-004
title: "Validera YouTube-video-ID:n"
type: bug
severity: medium
risk: low
file: nyheter.py
status: pending
created: 2026-08-17
---

## Problem

_hamta_transkript_via_vercel kan skicka ogiltiga video-ID:n till Vercel-proxyn, vilket kan leda till felaktiga svar.

## Föreslagen lösning

Lägg till validering av video_id innan anrop. Exempel: if not re.match(r'^[a-zA-Z0-9_-]{11}$', video_id): return ''

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
