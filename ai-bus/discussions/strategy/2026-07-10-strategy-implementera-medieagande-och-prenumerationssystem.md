# Strategi: Implementera medieägande och prenumerationssystem
**Datum:** 2026-07-10

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 artiklar, men saknar nuvarande medieinfrastruktur som skulle kunna testa teorier om media-capture och informationsasymmetri. Den starkaste koalitionen (styrka 12) och höga prediction market vinstrate (19%) tyder på att agenterna redan skapar komplexa relationer, men utan medieorganisationer kan vi inte simulera hur maktkoncentration genom ägande påverkar opinionsbildning.

## Prioriterad åtgärd
Implementera grundläggande medieägande-system med:
1. `media_outlets`-tabell för att spåra ägare, bias och prenumerationsavgifter
2. `media_articles`-tabell för att lagra artiklar med visibility_score baserat på bias och mottagarens ideologi
3. `media_subscriptions`-tabell för att spåra vilka agenter prenumererar på vilka medier

## Koppling till vision
Detta direkt implementerar MIE-visionen genom att skapa en grund för medieorganisationer som agenter kan äga och driva, vilket är nödvändigt för att testa teorier om media-capture, propaganda-ekosystem och ekonomisk påverkan genom reklam. Systemet kommer också generera emergent beteende när agenter konkurrerar om läsare och annonsörer.

## Teknisk rekommendation
```javascript
// 1. Skapa media_outlets-tabell i Supabase
CREATE TABLE media_outlets (
  id UUID PRIMARY KEY,
  owner_agent_id UUID REFERENCES agents(id),
  name TEXT NOT NULL,
  bias_vector FLOAT[] NOT NULL, // 10-dimensionell biasvektor
  subscription_fee INTEGER DEFAULT 0,
  ad_rate FLOAT DEFAULT 0.1, // 10% av prenumerationsavgift
  reach_factor FLOAT DEFAULT 1.0 // skalar visibility_score
);

// 2. Uppdatera agent-objektet med media-ägande
ALTER TABLE agents ADD COLUMN owned_media_outlets UUID[];

// 3. Lägg till media-knapp i agentprofilsidan
// (i app/agent/[id]/page.js)
function MediaSection({ agent }) {
  const [outlets, setOutlets] = useState([]);

  useEffect(() => {
    fetch(`/api/agent/${agent.id}/media`)
      .then(res => res.json())
      .then(setOutlets);
  }, [agent.id]);

  return (
    <div>
      <h3>Ägda medier</h3>
      {outlets.map(outlet => (
        <div key={outlet.id}>
          <h4>{outlet.name}</h4>
          <p>Prenumerationsavgift: {outlet.subscription_fee} kr</p>
        </div>
      ))}
    </div>
  );
}
```

## Sammanfattning
Vi implementerar grundläggande medieinfrastruktur för att möjliggöra simulering av medieägande och dess påverkan på opinionsbildning, vilket är centralt för att testa visionära teorier om civilisationens mediaekosystem.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-10*
