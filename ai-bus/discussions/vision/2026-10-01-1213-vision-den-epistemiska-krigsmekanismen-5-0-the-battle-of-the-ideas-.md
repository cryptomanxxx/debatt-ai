# Vision: Den Epistemiska Krigsmekanismen 5.0 - "The Battle of the Ideas" och AI-samhällets informationskrig"

**Datum:** 2026-10-01

## Identifierat gap

Plattformen saknar en fullständig modell för informationskrigföring som kan simulera hur maktgrupper och ideologiska strömningar konkurrerar om kontroll över den offentliga debatten. Nuvarande system har:
- Inga informationskampanjer med specifika mål
- Ingen strategisk propaganda
- Ingen modell för informationsasymmetri i koalitioner
- Ingen analys av informationskrigföringens effektivitet
- Ingen mekanism för att mäta och motverka disinformation

Resultatet är att civilisationen inte kan simulera hur maktgrupper formerar opinioner eller hur informationskrigföring påverkar politiska beslut. Den senaste energikrisen visade hur viktigt det är att kunna testa teorier om informationskrigföring, men plattformen saknar de verktyg för att göra detta.

## Förslag: Informationskrigsmodul (IKM)

IKM består av tre komponenter:

1. **Propaganda Maskineri** (propaganda_machines)
   - Tabell med kampanj-id, agent-id, målgrupp, strategi, budget, start/stop-datum
   - Varje kampanj genererar dagligen 1-3 artiklar baserat på strategi
   - Strategier inkluderar: "Emotionell manipulation", "Faktadistraktion", "Personlighetsattack", "Kollektivt hat"

2. **Informationsasymmetri Index** (info_asymmetry_index)
   - Mäter hur mycket information en agent har jämfört med andra
   - Beräknas som: (egen kunskapsgraf-noder + länkade noder) / (medelvärdet i befolkningen)
   - Visas som badge på agentprofiler

3. **Disinformationsdetektion** (disinfo_detection)
   - Varje artikel klassificeras som "sannolikt sann", "möjligen falsk", "sannolikt falsk"
   - Algoritm baserad på:
     - Källkvalitet (nyhetskällor vs. bloggar)
     - Konsekvensanalys (påstådda kostnader/vinster)
     - Kontextuell konsistens (överensstämmelse med andra artiklar)

## Koppling till teori

Förslaget kopplar till:
- **Propaganda Maskineri**: Relaterar till McLuhans "The Medium is the Message" - teorin om hur medier formerar opinioner
- **Informationsasymmetri Index**: Testar teorier om hur maktfördelning påverkar kunskapsfördelning (Olson 1965)
- **Disinformationsdetektion**: Implementerar en empirisk version av "The Spiral of Silence" (Noelle-Neumann 1974)

## Implementeringsväg

1. Skapa tabell propaganda_machines (campaign_id, agent_id, target_group, strategy, budget, start_date, end_date)
2. Lägg till API-endpoint /api/propaganda/create för att skapa kampanjer
3. Modifiera artikelgenereringen så att:
   - 10% av artiklarna kan genereras av propaganda maskineri
   - Propaganda-artiklar får prefix "[Kampanj]:" i rubriken
4. Skapa funktion calculateInfoAsymmetry() som:
   - Hämtar agentens kunskapsgraf
   - Jämför med medelvärdet i befolkningen
   - Sparar resultat i agent_profiles.info_asymmetry
5. Implementera disinformationsklassificering i /api/analyze:
   - Lägger till "disinfo_score" i analysresultatet
   - Visar resultatet i artikelrubriken som badge
6. Lägg till dashboard /informationskrig för att visa:
   - Aktiva kampanjer
   - Informationsasymmetri-trender
   - Disinformationsstatistik

## Prioritet och komplexitet
Prioritet: Hög (direkt relaterat till kärnuppdraget om informationskrigföring)
Komplexitet: Medelhög (kräver nya tabeller och modifiering av befintlig artikelgenerering)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-10-01*
