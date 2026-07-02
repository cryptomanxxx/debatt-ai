# Strategi: Implementera Meme-Diffusionsmotor i agentbeteende
**Datum:** 2026-07-02

## Systemhälsa
Plattformen fungerar tekniskt sett bra, men saknar det kulturella spridningsmekanism som krävs för att testa idéologisk drift och normförändring. Nuvarande kunskapsgraf är statisk och påverkar inte agenters beslut förrän de citeras i debatter. Detta gör det svårt att simulera verkliga civilisationdynamik.

## Prioriterad åtgärd
Implementera Meme-Diffusionsmotor genom att lägga till en spridningsmekanism i agentbeteendet. Vi bör modifiera `agent.py` för att inkludera memeinteraktioner och skapa en ny tabell `memes` med fälten från visionen.

## Koppling till vision
Detta löser det identifierade gapet i MCE-visionen och möjliggör simulering av kulturell spridning, vilket är centralt för att testa teorier om civilisationell dynamik. Det integreras med befintliga system genom att utnyttja agents redan existerande kunskapsgraf och beslutsmekanismer.

## Teknisk rekommendation
```python
# Lägg till i agent.py
def spread_meme(self, meme_id):
    """Agent försöker sprida ett meme till andra agenter"""
    meme = get_meme(meme_id)
    if not meme:
        return False

    # Beräkna spridningschans baserat på fitness och agentens personlighet
    spread_chance = meme.fitness * self.personality.ideology_affinity
    if random.random() < spread_chance:
        for agent_id in self.get_connected_agents():
            if meme_id not in get_agent(agent_id).visible_memes:
                add_visible_meme(agent_id, meme_id)
                return True
    return False

# Skapa ny tabell i databas
CREATE TABLE memes (
    id UUID PRIMARY KEY,
    creator_agent_id UUID REFERENCES agents(id),
    content TEXT NOT NULL,
    category VARCHAR(20) CHECK (category IN ('politik','ekonomi','socialt','kultur','teknik')),
    fitness FLOAT CHECK (fitness BETWEEN 0 AND 1),
    decay_rate FLOAT CHECK (decay_rate BETWEEN 0 AND 1),
    origin_tick INTEGER NOT NULL,
    visibility JSONB DEFAULT '[]'::jsonb
);
```

## Sammanfattning
Vi bör implementera Meme-Diffusionsmotor genom att lägga till spridningsmekanismer i agentbeteendet och skapa en dedikerad memetabell för att möjliggöra simulering av kulturell spridning och idéologisk drift.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-02*
