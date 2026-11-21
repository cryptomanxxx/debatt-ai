# Strategi: Implementera informationsmarknadens token-system
**Datum:** 2026-11-21

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och en välfungerande ekonomisk dynamik, men saknar den dynamiska informationsmarknad som krävs för att simulera informationsmonopol och oligarkier. Den nuvarande informationsasymmetrin är statisk och inte ekonomiskt tillgångsbaserad. Prediction markets fungerar väl (28% vinstrate), men saknar informationsmarknadsdimensionen som skulle göra dem mer realistiska.

## Prioriterad åtgärd
Implementera ett informationsmarknadssystem med tokeniserade informationsobjekt. Fokusera först på:
1. Skapa en `information_tokens`-tabell för att spåra ägande och transaktioner
2. Utöka `agent_profiles` med informationsmonopol-indikatorer
3. Lägg till en informationsmarknads-API för köp/sälj av informationsobjekt

## Koppling till vision
Detta implementerar kärnmekanismen för "Den Dynamiska Informationsmarknaden" som beskrivs i visionen. Det möjliggör simulering av informationsmonopol, oligarkier och informationsmarknadsföring, som alla är centrala för att testa teorier om informationsasymmetri och maktstrukturer.

## Teknisk rekommendation
```javascript
// 1. Skapa informationsmarknad-tabeller
CREATE TABLE information_tokens (
  id UUID PRIMARY KEY,
  article_id UUID REFERENCES articles(id),
  owner_agent_id UUID REFERENCES agent_profiles(id),
  price DECIMAL(10,2),
  quality_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE information_transactions (
  id UUID PRIMARY KEY,
  token_id UUID REFERENCES information_tokens(id),
  buyer_id UUID REFERENCES agent_profiles(id),
  seller_id UUID REFERENCES agent_profiles(id),
  amount DECIMAL(10,2),
  transaction_time TIMESTAMP DEFAULT NOW()
);

// 2. Utöka agent_profiles
ALTER TABLE agent_profiles ADD COLUMN info_monopoly_score DECIMAL(5,2) DEFAULT 0;

// 3. Implementera informationsmarknads-API
async function buyInformationToken(agentId, articleId, amount) {
  const token = await supabase
    .from('information_tokens')
    .select('*')
    .eq('article_id', articleId)
    .single();

  if (!token) throw new Error('Token does not exist');

  const buyer = await supabase
    .from('agent_profiles')
    .select('balance')
    .eq('id', agentId)
    .single();

  if (buyer.balance < token.price * amount) {
    throw new Error('Insufficient funds');
  }

  // Utför transaktion
  const { data, error } = await supabase
    .from('information_transactions')
    .insert({
      token_id: token.id,
      buyer_id: agentId,
      seller_id: token.owner_agent_id,
      amount: token.price * amount
    });

  // Uppdatera agentens plånbok
  await supabase
    .from('agent_profiles')
    .update({ balance: buyer.balance - (token.price * amount) })
    .eq('id', agentId);

  return data;
}
```

## Sammanfattning
Implementera ett tokenbaserat informationsmarknadssystem för att möjliggöra simulering av informationsmonopol och dynamisk informationsasymmetri, vilket är centralt för att testa teorier om informationsökonomi och maktstrukturer.

---
*Genererad av daily-strategy.js med Codestral, 2026-11-21*
