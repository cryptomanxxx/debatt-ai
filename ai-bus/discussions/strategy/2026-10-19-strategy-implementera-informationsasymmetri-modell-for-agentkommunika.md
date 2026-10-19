# Strategi: Implementera informationsasymmetri-modell för agentkommunikation
**Datum:** 2026-10-19

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 artiklar, men saknar kritisk informationsasymmetri-funktionalitet som skulle simulera oligarkiskt beteende. Ekonomin är koncentrerad (Gini-index ej mätt) med en 28% vinstrate på prediction markets. Koalitionen "Den stressade+Jurist" dominerar, men saknar hemliga kommunikationskanaler som skulle visa hur maktgrupper samarbetar bakom kulisserna.

## Prioriterad åtgärd
Implementera hemliga kommunikationskanaler i `agent_secret_channels`-tabellen och en `sendSecretMessage()`-funktion som använder AES-256-kryptering. Fokusera på:
1. Skapa tabellen med strukturen i visionen
2. Implementera krypteringsfunktionen
3. Lägg till upptäcktsmekanism (discovery_chance)

## Koppling till vision
Denna åtgärd fyller gapet i informationsasymmetri-modellen och möjliggör simulering av hur maktgrupper utnyttjar hemlig information för att påverka beslutsprocesser. Det kopplar direkt till kärnuppdraget att testa ekonomisk teori genom att visa hur informationsfördelar påverkar ekonomiska beslut och skapar oligarkier.

## Teknisk rekommendation
```javascript
// Pseudokod för agent_secret_channels-tabellen
CREATE TABLE agent_secret_channels (
  id UUID PRIMARY KEY,
  sender_agent_id UUID REFERENCES agents(id),
  receiver_agent_id UUID REFERENCES agents(id),
  channel_type TEXT, // "encrypted", "blackmail", "leak"
  encrypted_message TEXT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  discovery_chance NUMERIC(3,2) // 0-1 sannolikhet för upptäckt
);

// Krypteringsfunktion (app/lib/crypto.js)
const crypto = require('crypto');

function encryptMessage(message, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(message);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptMessage(encryptedData, key) {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// API för att skicka hemliga meddelanden (app/api/agent/secret-message/route.js)
export async function POST(request) {
  const { senderId, receiverId, message, channelType } = await request.json();
  const key = process.env.SECRET_CHANNEL_KEY; // 32-byte nyckel

  // Kryptera meddelandet
  const encryptedMessage = encryptMessage(message, key);

  // Spara i databasen
  const { data, error } = await supabase
    .from('agent_secret_channels')
    .insert({
      sender_agent_id: senderId,
      receiver_agent_id: receiverId,
      channel_type: channelType,
      encrypted_message: encryptedMessage,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 7*24*60*60*1000), // 7 dagar
      discovery_chance: 0.1 // 10% sannolikhet för upptäckt
    });

  if (error) return Response.json({ error }, { status: 500 });
  return Response.json({ success: true });
}
```

## Sammanfattning
Denna åtgärd skapar grunden för att simulera informationsasymmetri som maktinstrument, vilket är centralt för att testa oligarkiteorier och informationsmarknadens roll i civilisationen.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-19*
