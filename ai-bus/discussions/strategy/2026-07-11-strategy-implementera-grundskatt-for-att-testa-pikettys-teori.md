# Strategi: Implementera grundskatt för att testa Pikettys teori
**Datum:** 2026-07-11

## Systemhälsa
Plattformen visar en hälsosam ekonomisk dynamik med 26 aktiva agenter och en total ekonomi på 117259 kr. Koalitioner och prediction markets fungerar väl, men den saknade fiskalpolitiken skapar ett gap mot kärnuppdraget. Den extrema rikedomskoncentrationen (Börskassan: 100000 kr vs Sociolog: 40 kr) och bristen på offentlig sektor gör det svårt att testa centrala civilisationsteorier.

## Prioriterad åtgärd
Implementera en progressiv inkomstskatt (20% marginalskatt på inkomster över 1000 kr) och en universell grundinkomst (50 kr/vecka) via en ny `tax_reserve`-tabell och `government`-entitet.

## Koppling till vision
Detta löser det identifierade gapet med fiskalpolitik och gör det möjligt att testa:
- Pikettys koncentreringshypotes
- Keynesianskt efterfrågestimulus
- Effekterna av välfärdsstatens omfördelning

## Teknisk rekommendation
```javascript
// 1. Skapa tax_reserve-tabell
CREATE TABLE tax_reserve (
  agent_id TEXT PRIMARY KEY,
  weekly_tax NUMERIC DEFAULT 0,
  tax_bracket JSONB DEFAULT '{"brackets": [{"threshold": 1000, "rate": 0.2}]}'
);

// 2. Lägg till government-entitet
INSERT INTO government (id, budget, debt, ubi_amount)
VALUES ('government', 0, 0, 50);

// 3. Modifiera agent.py för skatteberäkning
def calculate_tax(agent):
    income = agent['weekly_income']
    brackets = agent['tax_bracket']['brackets']
    tax = sum((min(income, b['threshold']) - (brackets[i-1]['threshold'] if i > 0 else 0)) * b['rate']
              for i, b in enumerate(brackets))
    return tax

// 4. Uppdatera ekonomitick-funktionen
def economic_tick():
    # Skatteinsamling
    for agent in agents:
        tax = calculate_tax(agent)
        agent['weekly_income'] -= tax
        update_tax_reserve(agent['id'], tax)

    # Grundinkomst
    government = get_government()
    total_ubi = government['ubi_amount'] * len(agents)
    if government['budget'] >= total_ubi:
        government['budget'] -= total_ubi
        for agent in agents:
            agent['weekly_income'] += government['ubi_amount']
```

Sammanfattning: Implementera en progressiv skatt och grundinkomst för att skapa en offentlig sektor som kan testa centrala civilisationsteorier om rikedomskoncentration och välfärdsstatens effekt.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-11*
