# Strategi: Implementera informationsbörsens kärnmekanismer
**Datum:** 2026-11-13

## Systemhälsa
Plattformen visar stabil ekonomisk aktivitet (1M kr total ekonomi) och politisk dynamik (500 röster/dag, 28% prediction market vinst), men saknar den dynamiska informationsmarknad som krävs för att fullt ut testa oligarkiteori och informationsasymmetri. Den nuvarande informationsasymmetrin (3 nivåer) är statisk och saknar ekonomisk dimensionering.

## Prioriterad åtgärd
Implementera grundläggande informationsbörsmekanismer genom att skapa en ny tabell `informationsobjekt` och modifiera befintliga system:

1. Tabellstruktur:
```sql
CREATE TABLE informationsobjekt (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agenter(id),
  artikel_id UUID REFERENCES artiklar(id),
  pris DECIMAL(10,2) DEFAULT 1.00,
  typ TEXT CHECK (typ IN ('exklusiv', 'öppen')),
  skapad_at TIMESTAMP DEFAULT NOW(),
  uppdaterad_at TIMESTAMP
);
```

2. API-endpoint för köp/sälj:
```javascript
// app/api/informationsobjekt/[id]/route.js
export async function POST(request) {
  const { agentId, action } = await request.json();

  if (action === 'köp') {
    // Hantera köp-transaktion
    // 1. Kontrollera agentens budget
    // 2. Skapa köp-post i informationsobjekt_transaktioner
    // 3. Uppdatera agentens budget
  } else if (action === 'sälj') {
    // Hantera sälj-transaktion
  }
}
```

## Koppling till vision
Denna åtgärd implementerar kärnmekanismen för informationsbörsen som beskrivs i visionen, vilket direkt adresserar gapen:
1. Skapar möjlighet att simulera informationsmonopol
2. Ger agenter ekonomiska motiv att köpa/sälja information
3. Lägger grunden för att analysera hur informationsspridning påverkar politisk representation
4. Ger verktyg för att testa informationskostnader och deras effekt på debatt

## Teknisk rekommendation
```javascript
// Pseudokod för informationsvärderingsalgoritm
function beräknaInformationspris(artikel) {
  // Baspris baserat på artikelens egenskaper
  let pris = 1.00;

  // Justera för nyhetsvärde
  pris *= (artikel.läsningar / 100) * (artikel.citeringar / 10);

  // Justera för politisk påverkan
  pris *= artikel.politisk_påverkan * 2;

  // Justera för unikhet
  pris *= artikel.unikhet * 3;

  // Begränsa till 1-10 kr
  return Math.min(Math.max(pris, 1), 10);
}
```

## Sammanfattning
Prioritera implementation av informationsbörsens grundläggande tabellstruktur och API för att skapa den dynamiska informationsekonomi som krävs för att fullt ut testa plattformens kärnuppdrag.

---
*Genererad av daily-strategy.js med Codestral, 2026-11-13*
