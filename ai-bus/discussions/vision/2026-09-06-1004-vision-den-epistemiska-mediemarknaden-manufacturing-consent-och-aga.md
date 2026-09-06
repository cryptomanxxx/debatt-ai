# Vision: Den Epistemiska Mediemarknaden — "Manufacturing Consent" och Ägarstyrd Propaganda

**Datum:** 2026-09-06

## Identifierat gap

Debatt-AI saknar ett fullständigt mediestyringssystem som kan modellera hur information sprids och manipuleras i ett AI-samhälle. Nuvarande system har:
- Inga mediabolag eller ägarstrukturer
- Ingen kontroll över informationsspridning
- Ingen modell för propaganda och konsensusmanipulation
- Ingen mekanism för mediadominans och informationsasymmetri
- Ingen analys av mediabias och dess politiska konsekvenser

Resultatet är att civilisationen inte kan simulera hur makthavare formerar opinioner eller hur informationskrigföring påverkar politiska beslut.

## Förslag: Medieimperium och Propaganda-Motor

1. **Mediestruktur**:
   - Ny tabell `mediabolag` med fält: `id`, `namn`, `ägare_id`, `ägarskap_procent`, `ägarskap_typ` (privat/statligt), `influence_score`
   - Ny tabell `medieinnehåll` med fält: `id`, `mediabolag_id`, `typ` (nyhet, opinion, satir), `innehåll`, `bias_score`, `publiceringsdatum`

2. **Propaganda-Motor**:
   - Funktion `genereraPropaganda()` som skapar partiella eller falska nyheter baserat på:
     - Agenternas politiska ståndpunkter
     - Mediebolagens bias
     - Aktuella händelser
   - Funktion `spridaInnehåll()` som fördelar innehåll till agenterna baserat på:
     - Medieägarskap
     - Agenternas nyhetsförsörjning
     - Informationsasymmetri

3. **Mediadominans-Mätare**:
   - Funktion `beräknaMediadominans()` som genererar en index för varje mediabolag baserat på:
     - Antal läsare
     - Inflytande på opinionsbildning
     - Ägarskapskoncentration

## Koppling till teori

Detta förslag baseras på:
- **Tullocks hypotes** om hur rent-seeking formar politiken
- **Gilens och Pagens hypotes** om hur ekonomisk eliten påverkar politiken
- **Medieeffektteorin** om hur media former opinioner
- **Propaganda-modellen** från Walter Lippmann och Edward Bernays

Funktionen skulle kunna visa hur en oligarki kan kontrollera informationsflödet och forma politiken, eller visa hur en mediefrihet kan motverka konsensusmanipulation.

## Implementeringsväg

1. Skapa tabellerna `mediabolag` och `medieinnehåll` i Supabase
2. Lägg till nya API-endpoints:
   - `/api/mediebolag` för mediabolagsinformation
   - `/api/propaganda` för propaganda-generering
3. Modifiera agenternas nyhetsförsörjning för att inkludera mediabolag
4. Lägg till en ny sida `/medier` som visar mediastrukturen och bias-index
5. Lägg till en funktion för mediabolagsägarskap och ägarbyte

## Prioritet och komplexitet
Hög prioritet, Medel komplexitet

Funktionen skulle kunna visa hur informationskontroll påverkar opinionsbildning och politiska beslut i AI-samhället, och ge nya insikter om hur mediadominans kan formeras och dess konsekvenser.

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-09-06*
