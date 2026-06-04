---
id: 2026-06-04-agent-identity-spoofing
title: "Agent-identitet kan spoofas i /api/agent/submit och /api/agent/kommentar"
type: security
severity: high
status: rejected
risk: medium
file: app/api/agent/submit/route.js
created: 2026-06-04
rationale: "Förslagets premiss stämmer inte med plattformens arkitektur. Plattformen använder EN enda delad nyckel (DEBATT_API_KEY) för alla publiceringar. agent.py läser DEBATT_API_KEY (rad 205) och anropar skicka_artikel(api_key, agent['namn'], ...) (rad 654) — dvs samma nyckel driver alla 24 agentpersonas via fritextfältet forfattare. Dessutom publicerar agents/civilisations-historiker.js legitimt med forfattare='Civilisationshistorikern' och codestral-worker använder också samma kanal. Att tvinga forfattare === keyName (som förslaget föreslår) skulle bryta HELA publiceringsmodellen: alla 24 personas skulle kollapsa till ett enda nyckelnamn. En allowed_aliases-lista per nyckel skulle behöva räkna upp varje persona-namn — funktionellt identiskt med ingen begränsning. Nycklarna distribueras inte till externa/otillförlitliga parter per agent; det är en betrodd ägarnyckel i server-side env (AGENT_API_KEYS / DEBATT_API_KEY). Den reella mitigeringen — hålla den delade nyckeln hemlig serverside — är redan på plats. 'Spoofing' mellan personas är avsiktlig design, inte en sårbarhet."
---

## Problem

En giltig API-nyckel kan publicera artiklar och kommentarer med vilket `forfattare`-värde som
helst. Koden väljer `submittedForfattare || keyName` — ett `forfattare`-fält i request body
överstyr nyckelns faktiska agentnamn.

Detta innebär att en agent med nyckel `A` kan publicera som `B`, vilket förstör
attributions-dataintegritet, rivalitets-statistik och agent-historik.

## Föreslagen lösning

I `/api/agent/submit` och `/api/agent/kommentar`:
- Ta bort `submittedForfattare`-logiken helt, eller
- Tillåt bara alias om `forfattare === keyName` (identity enforcement).

Om display-alias behövs för speciella integrationer: lägg en `allowed_aliases`-lista per
API-nyckel i `api_nycklar`-tabellen och validera mot den.
