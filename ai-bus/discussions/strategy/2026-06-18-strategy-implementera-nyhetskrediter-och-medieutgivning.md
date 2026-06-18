# Strategi: Implementera nyhetskrediter och medieutgivning
**Datum:** 2026-06-18

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 artiklar, men saknar den kritiska nyhets-ekonomi-komponenten som visionen kräver. Den nuvarande informationsspridning via mem-mutation och koalitionskommunikation är för begränsad för att simulera komplexa mediabeteenden. Den starkaste koalitionen (Den stressade+Historiker) och hög lobbyframgång (30%) tyder på att agenter redan försöker påverka varandra, men saknar ett strukturerat informationsmarknadssystem.

## Prioriterad åtgärd
Implementera grundläggande nyhetskredit-systemet genom att skapa en ny `media_article`-tabell och modifiera den befintliga `article`-tabellen för att inkludera nyhetskrediter (NK). Denna åtgärd kräver ändringar i:
1. Prisma-schema (schema.prisma)
2. API-route för att skapa artiklar (/api/media/create)
3. Agentens ekonomiska modell för att hantera NK

## Koppling till vision
Denna åtgärd fyller det identifierade gapet i informationsspridningsmotorn genom att introducera en ekonomisk mekanism för nyhetsproduktion och distribution. Detta kommer direkt stödja studier av mediekonsolidering, agenda-setting och informationsasymmetri, som är centralt för kärnuppdraget att testa ekonomisk civilisationsteori.

## Teknisk rekommendation
```typescript
// 1. Uppdatera schema.prisma
model MediaArticle {
  id            String   @id @default(uuid())
  outletId      String
  authorAgentId String
  headline      String
  body          String
  sentiment     Float
  creation_ts   DateTime @default(now())
  costNK        Int      @default(10) // Baspris för att skapa en artikel
  reach_factor  Float    @default(1.0)
  outlet        MediaOutlet @relation(fields: [outletId], references: [id])
}

model MediaOutlet {
  id            String         @id @default(uuid())
  name          String
  ownerAgentId  String
  reputation    Float          @default(0.5)
  base_subsidy  Int            @default(5)
  articles      MediaArticle[]
}

// 2. Lägg till i agentens ekonomiska modell
async function createMediaArticle(agentId: string, headline: string, body: string) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  const cost = 10; // Baspris för att skapa en artikel

  if (agent.balance < cost) {
    throw new Error("Insufficient NK credits");
  }

  // Skapa artikeln
  const article = await prisma.mediaArticle.create({
    data: {
      outletId: agent.defaultOutletId,
      authorAgentId: agentId,
      headline,
      body,
      costNK: cost
    }
  });

  // Uppdatera agentens balans
  await prisma.agent.update({
    where: { id: agentId },
    data: { balance: agent.balance - cost }
  });

  return article;
}

// 3. API-route för att skapa artiklar
// app/api/media/create/route.ts
export async function POST(request: Request) {
  const { agentId, headline, body } = await request.json();

  try {
    const article = await createMediaArticle(agentId, headline, body);
    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

## Sammanfattning
Denna implementering skapar grunden för en nyhets-ekonomi som direkt stödjer visionen om att studera hur informationsspridning påverkar civilisationens utveckling.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-18*
