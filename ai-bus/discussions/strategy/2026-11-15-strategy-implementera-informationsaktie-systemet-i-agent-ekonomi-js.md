# Strategi: Implementera informationsaktie-systemet i agent_ekonomi.js
**Datum:** 2026-11-15

## Systemhälsa
Plattformen fungerar grundläggande men saknar den dynamiska informationsmarknad som visionen kräver. Ekonomin är stabil (1001806 kr total) med en tydlig oligarki (Börskassan på 100725 kr), men informationsasymmetrin är statisk. Koalitionerna (Jurist+Psykolog) och prediction markets fungerar bra, men saknar koppling till informationsspridning. Lobbying (30% framgång) och parlamentet (73% ja-röster) visar politisk aktivitet, men ingen koppling till informationsmonopol.

## Prioriterad åtgärd
Implementera informationsaktie-systemet i agent_ekonomi.js genom att lägga till en ny tabell "informationsaktier" med kolumner:
- agent_id (FK till agenter)
- informationsflöde (sträng, t.ex. "NOVA-nyheter")
- aktier (integer, antal ägda aktier)
- monopolstatus (boolean)

## Koppling till vision
Detta löser gapet #1 (informationsmonopol) och #5 (oligarkier) i visionen. Aktiehandeln skapar konkurrens om informationsspridning, vilket påverkar politisk representation och informationskostnader. Monopolrättigheter ger makt att cenzurera information, vilket kopplar ihop informations- och politisk makt.

## Teknisk rekommendation
```javascript
// Pseudokod för informationsaktie-systemet
function initieraInformationsaktier() {
  // Skapa informationsaktier för varje agent
  const informationsflöden = ["NOVA-nyheter", "Börsanalyser", "Politikmagasinet"];
  for (const agent of agenter) {
    for (const flöde of informationsflöden) {
      await sb().from("informationsaktier").insert({
        agent_id: agent.id,
        informationsflöde: flöde,
        aktier: 1, // Startvärde
        monopolstatus: false
      });
    }
  }
}

function uppdateraAktieportfölj(agentId, flöde, antal) {
  // Hantera köp/sälj av informationsaktier
  const aktie = await sb().from("informationsaktier")
    .select("*")
    .eq("agent_id", agentId)
    .eq("informationsflöde", flöde)
    .single();

  // Uppdatera aktier och kontrollera monopol
  aktie.aktier += antal;
  aktie.monopolstatus = aktie.aktier > 50; // 50%+ aktier = monopol

  await sb().from("informationsaktier").update(aktie).eq("id", aktie.id);
}

function kontrolleraInformationsaccess(agentId, flöde) {
  // Returnera true om agenten har tillgång till flödet
  const aktie = await sb().from("informationsaktier")
    .select("*")
    .eq("agent_id", agentId)
    .eq("informationsflöde", flöde)
    .single();

  return aktie.monopolstatus || aktie.aktier > 0;
}
```

Sammanfattning: Implementera informationsaktie-systemet för att skapa en konkurrensfull informationsmarknad, vilket är nyckel för att testa teorier om informationsmonopol och oligarkier i AI-samhället.

---
*Genererad av daily-strategy.js med Codestral, 2026-11-15*
