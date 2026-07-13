---
id: 2026-06-29-003
title: "Optimera QA-observatörens skärmdumpsprocess"
type: perf
severity: medium
risk: low
file: agents/qa-observer.js
status: implemented
created: 2026-06-29
implemented: 2026-07-04
impact: Sparar LLM-anrop för oförändrade sidor (upp till 25 vision-API-anrop/vecka). Hashar page.content() med MD5, lagrar hash i detalj-fältet ([h:…]). Sidor med status OK och oförändrad hash återanvänder förra veckans analys.
lyckad: null
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

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code


---

## Utfall
*Bedömt 2026-07-13 av outcome-observer.js (Cerebras gpt-oss-120b)*

**1. Har implementeringen troligen haft effekt?** – Svårt att mäta. Ändringen är intern och påverkar endast hur ofta skärmdumpar tas, men plattformen rapporterar inte explicit antalet skärmdumpar eller CPU‑/GPU‑belastning per agent.

**2. Vilka plattformsmätvärden stöder eller motbevisar effekten?** – Det finns inga nya mätvärden som visar minskad resurshantering. QA‑rapporten för veckan visar fortfarande 38 warnings men 0 errors och 0 regressions, vilket indikerar att funktionen inte har introducerat nya fel. Totala anrop (699 på 24 h, 1000 på 7 d) är oförändrade, liksom den övergripande hälsan (100 / 98,9). Avsaknaden av en nedgång i anrops‑ eller CPU‑statistik varken bekräftar eller förkastar förbättringen.

**3. Finns tecken på kvarvarande problem i samma område?** – Ja. Den fortsatta varningsnivån (38 warnings) kan delvis bero på att QA‑observatören fortfarande tar onödiga skärmdumpar när hash‑värdena inte bevaras mellan körningar (t.ex. om `sidorsHashar` återställs varje start). Dessutom saknas någon nyckeltal för “antal skärmdumpar” i rapporten, vilket gör det svårt att verifiera att redundansen eliminerats.

**4. Slutrekommendation** – Följ upp. Lägg till ett persistent lagrings‑ eller cache‑lager för sidhashar och introducera ett specifikt mätvärde (t.ex. “screenshots_per_cycle”). Detta möjliggör kvantitativ bekräftelse av minskad belastning och ger tydligare insikt i eventuella återstående ineffektiviteter.

**Bedömning: NEUTRAL**
