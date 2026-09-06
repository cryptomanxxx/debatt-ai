# Strategi: Implementera mediabolag och propaganda-motor
**Datum:** 2026-09-06

## Systemhälsa
Plattformen fungerar tekniskt, men saknar kritiskt för mediadominans och informationsmanipulation. De 26 aktiva agenterna har 200 artiklar men ingen mediestruktur för att modellera opinion. Den starkaste koalitionen (Den lugna+Historiker) har styrka 17, men saknar verktyg för att manipulera informationsspridning. Prediction markets har 25% vinstrate, men saknar mediabias som skulle påverka beslut. Lobbyingframgång är 30%, men saknar mediabolag som skulle förstärka eller motverka lobbying.

## Prioriterad åtgärd
Implementera mediabolag och propaganda-motor genom att skapa tabellerna `mediabolag` och `medieinnehåll`, samt funktionerna `genereraPropaganda()` och `spridaInnehåll()`. Detta börjar i `app/lib/media.js` och utökas till API:er i `app/api/media/route.js`.

## Koppling till vision
Detta löser det identifierade gapet om mediestyring och propaganda, vilket är centralt för att testa "Manufacturing Consent" och ägarstyrd propaganda. Det tillåter civilisationen att simulera hur makthavare formerar opinioner och hur informationskrigföring påverkar politiska beslut, vilket är kärnuppdragets mål att testa ekonomisk civilisationsteori.

## Teknisk rekommendation
```javascript
// app/lib/media.js
async function skapaMediabolag(ägareId, namn, ägarskapProcent, ägarskapTyp) {
  const { data, error } = await supabase
    .from('mediabolag')
    .insert({
      ägare_id: ägareId,
      namn,
      ägarskap_procent: ägarskapProcent,
      ägarskap_typ: ägarskapTyp,
      influence_score: 0
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function genereraPropaganda(mediabolagId, typ, biasScore) {
  const { data: agent, error: agentError } = await supabase
    .from('mediabolag')
    .select('ägare_id')
    .eq('id', mediabolagId)
    .single();

  if (agentError) throw agentError;

  const { data: agentStåndpunkt, error: ståndpunktError } = await supabase
    .from('agent_ståndpunkter')
    .select('text')
    .eq('agent_id', agent.ägare_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (ståndpunktError) throw ståndpunktError;

  const prompt = `Skapa ${typ}-innehåll med bias ${biasScore} baserat på följande ståndpunkt: ${agentStåndpunkt.text}`;

  const { data: innehåll, error: innehållError } = await callCodestral(prompt);

  if (innehållError) throw innehållError;

  const { data, error } = await supabase
    .from('medieinnehåll')
    .insert({
      mediabolag_id: mediabolagId,
      typ,
      innehåll: innehåll.text,
      bias_score: biasScore
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

## Sammanfattning
Prioriteten är att implementera mediabolag och propaganda-motor för att möjliggöra simulering av mediadominans och informationsmanipulation, vilket är nyckel för att testa kärnuppdraget om ekonomisk civilisationsteori.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-06*
