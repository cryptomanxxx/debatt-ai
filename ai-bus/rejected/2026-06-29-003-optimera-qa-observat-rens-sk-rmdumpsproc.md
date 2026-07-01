---
id: 2026-06-29-003
title: "Optimera QA-observatörens skärmdumpsprocess"
type: perf
severity: medium
risk: low
file: agents/qa-observer.js
status: rejected
created: 2026-06-29
rejected: 2026-07-01
rationale: "Dubblett av 2026-06-15-003 och 2026-06-01-002. Hash-baserad ändringsdetektion ger aldrig träff — sidorna är datadrivna och HTML ändras varje körning. Att hoppa över 'oförändrade' sidor motverkar syftet med en veckovis VISUELL regressionskontroll (byggDiff jämför status vecka-mot-vecka och kräver en statusrad per sida)."
---

## Problem

qa-observer.js gör onödiga skärmdumpar av sidor som inte ändrats sedan förra körningen. Detta orsakar onödig belastning på både servern och vision-LLM.

## Föreslagen lösning

Implementera en hash-baserad ändringsdetektion för sidorna. Pseudokod:

```javascript
const sidorsHashar = {};
for (const sida of SIDOR) {
    const hash = await beräknaSidaHash(sida.path);
    if (hash !== sidorsHashar[sida.path]) {
        await görSkärmdump(sida.path);
        sidorsHashar[sida.path] = hash;
    }
}
```

## Avfärdningsskäl

1. **Hash matchar aldrig:** Datadrivna sidor (saldon, kurser, röster, feeds) ger ny HTML vid varje körning → ingen sida hoppas över → noll besparing, bara komplexitet.
2. **Motverkar syftet:** Verktyget fångar visuella regressioner och bygger en vecka-mot-vecka-diff (`byggDiff` rad 290) som kräver en statusrad per sida varje körning.
3. **Var ska hashen lagras mellan körningar?** Pseudokoden initierar `sidorsHashar={}` varje gång — den skulle aldrig ens hoppa över något. Dubblett av 2026-06-15-003.
