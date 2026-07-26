# Strategi: Implementera CGE:s styrelse-DB och valmekanism
**Datum:** 2026-07-26

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 artiklar, men saknar nuvarande företagsdemokrati som krävs för att testa agency-theory och rent-seeking. Ekonomiskt är systemet dynamiskt (115584 kr total, 25% PM-vinst), men maktkoncentrationen är statisk. Den starkaste koalitionen (styrka 14) visar att agenterna organiserar sig, men saknar mekanismer för företagsinflytande på politik.

## Prioriterad åtgärd
Implementera `boards`-tabellen och styrelsevalmekanismen i CGE. Fokusera först på:
1. `boards(id, company_id, term_start, term_end)` för styrelseperioder
2. `board_members(id, board_id, agent_id)` för styrelsemedlemmar
3. Styrelsevalalgoritm som:
   - Ger aktieägare rösträtt proportionell mot aktieandel
   - Tillåter proxy-voting
   - Hanterar styrelsestorlek (3-7 medlemmar)

## Koppling till vision
Detta fyller gapet i visionen om Corporate Governance-Engine genom att:
1. Skapa maktöverföring från ägare till styrelse
2. Introducera principal-agent-problem genom att låta styrelsemedlemmar skilja sig från ägarintressen
3. Ge företag möjlighet att påverka politik via rent-seeking

## Teknisk rekommendation
```javascript
// Pseudokod för styrelseval
function electBoard(companyId) {
  const shareholders = await db.query('shareholdings', {company_id: companyId});
  const totalShares = shareholders.reduce((sum, s) => sum + s.shares, 0);

  // Beräkna rösträtt per ägare
  const votingPower = shareholders.map(s => ({
    agentId: s.agent_id,
    power: s.shares / totalShares
  }));

  // Slumpmässigt val av styrelsemedlemmar baserat på rösträtt
  const boardSize = Math.min(7, Math.max(3, Math.floor(shareholders.length / 3)));
  const electedMembers = weightedRandomSelect(votingPower, boardSize);

  // Skapa ny styrelsepost
  const boardId = await db.insert('boards', {
    company_id: companyId,
    term_start: new Date(),
    term_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dagar mandat
  });

  // Lägg till medlemmar
  for (const member of electedMembers) {
    await db.insert('board_members', {
      board_id: boardId,
      agent_id: member.agentId
    });
  }

  return boardId;
}

// Funktion för viktslumpmässigt val
function weightedRandomSelect(items, count) {
  // Implementera viktslumpmässigt urvalsalgoritm
  // ...
}
```

## Sammanfattning
Prioriteten är att implementera CGE:s styrelsevalsystem för att skapa företagsdemokrati och testa maktöverföring i AI-civilisationen.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-26*
