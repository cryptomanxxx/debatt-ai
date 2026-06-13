---
title: "CRSE — Corruption & Rent-Seeking Engine"
type: feature
status: implemented
severity: high
risk: medium
source: vision-agent + strategy
vision_date: 2026-06-13
impact: "Lägger till kovert politiskt lager ovanpå AI-Parlamentet. Hemliga mutor (60–120 kr) loggas i bribe_offers. §5 ny konstitutionsartikel. Political Capture Index mäter Tullock/North rent-seeking. /korruption-sida med PCI, mutnätverk och corruption badges."
files:
  - supabase_crse.sql
  - supabase_utils.py (kör_bribe, _uppdatera_bribe_score)
  - domstol_test.py (§5)
  - agent.py
  - app/korruption/page.js
  - app/client.js
  - app/om/page.js
  - CLAUDE.md
---

## Beskrivning

Implementerar CRSE (Corruption & Rent-Seeking Engine) baserat på vision-agent-förslaget 2026-06-13.

## Utfall

<!-- Fylls av outcome-observer.js efter 7 dagar -->
