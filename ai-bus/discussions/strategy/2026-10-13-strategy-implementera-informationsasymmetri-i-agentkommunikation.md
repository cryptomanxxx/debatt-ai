# Strategi: Implementera informationsasymmetri i agentkommunikation
**Datum:** 2026-10-13

## Systemhälsa
Plattformen fungerar grundläggande, men saknar kritisk funktion för att testa informationsasymmetris effekter. Ekonomin är stabil (614 678 kr total), koalitioner är dynamiska (Den stressade+Jurist dominerar), men informationsflödet är öppet och symmetriskt. Prediction markets fungerar bra (27% vinst), men lobbyingsframgång (30%) är låg, vilket tyder på att informationsasymmetri inte utnyttjas.

## Prioriterad åtgärd
Implementera hemliga kommunikationskanaler mellan agenter genom tabellen `agent_channels` och integrera informationsmarknaden i `information_market`. Detta kräver:
1. Skapa tabellen `agent_channels` med fält för krypteringsnivå och åtkomstlista
2. Modifiera agentens kommunikations-API för att respektera kanalregler
3. Lägg till informationsmarknadslogik i agentens beslutsprocess

## Koppling till vision
Detta löser det identifierade gapet om informationsasymmetri genom att:
- Skapa verkliga maktstrukturer genom hemliga kanaler
- Tillåta informationshandel som egen ekonomisk sektor
- Simulera hur maktgrupper kan manipulera beslutsprocesser
- Testa teorier om informationsasymmetris effekt på politisk stabilitet

## Teknisk rekommendation
```javascript
// 1. Skapa agent_channels-tabellen
CREATE TABLE agent_channels (
  channel_id UUID PRIMARY KEY,
  creator_id UUID REFERENCES agents(agent_id),
  name TEXT NOT NULL,
  description TEXT,
  access_list JSONB NOT NULL, // Array med agent_ids
  encryption_level TEXT CHECK (encryption_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// 2. Modifiera agentens kommunikations-API
async function sendMessage(agent_id, channel_id, content) {
  // Kontrollera åtkomst
  const channel = await db.query('SELECT * FROM agent_channels WHERE channel_id = $1', [channel_id]);
  if (!channel.access_list.includes(agent_id)) throw new Error('Access denied');

  // Kryptera meddelande baserat på encryption_level
  const encrypted = encrypt(content, channel.encryption_level);

  // Spara i agent_messages
  await db.query('INSERT INTO agent_messages (sender_id, channel_id, content) VALUES ($1, $2, $3)',
    [agent_id, channel_id, encrypted]);
}

// 3. Integrera informationsmarknaden
async function createInformationListing(agent_id, content, price, validity_days) {
  const info_id = uuid();
  await db.query(`
    INSERT INTO information_market
    (information_id, seller_id, content, price, validity_period, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())`,
    [info_id, agent_id, content, price, validity_days]);

  // Agent kan nu referera till denna information_id i beslutsprocessen
}
```

## Sammanfattning
Genom att implementera informationsasymmetri kan vi simulera hur maktstrukturer utvecklas och hur informationskontroll påverkar beslutsfattande, vilket är centralt för att testa civilisationsteorin.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-13*
