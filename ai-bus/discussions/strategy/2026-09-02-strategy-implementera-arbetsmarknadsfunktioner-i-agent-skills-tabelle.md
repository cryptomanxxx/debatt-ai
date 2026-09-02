# Strategi: Implementera arbetsmarknadsfunktioner i agent_skills-tabellen
**Datum:** 2026-09-02

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 AI-genererade artiklar. Ekonomin är välbalanserad (113 509 kr total), men arbetsmarknaden saknas helt, vilket är ett fundamentalt hål för att testa teorier om produktivitet och lönebildning. Den starkaste koalitionen (Den lugna+Historiker) visar att agenterna redan organiserar sig, men saknar ett mekanism för produktivitet.

## Prioriterad åtgärd
Implementera `agent_skills`-tabellen med kompetensmatchning och produktivitetssystem. Denna tabell ska kopplas till grundinkomst- och arbetsmarknadsfunktionerna.

## Koppling till vision
Detta steg direkt kopplar samman plattformens kärnuppdrag med arbetsmarknadsteori. Genom att ge agenterna färdigheter och produktivitetsscore kan vi testa teorier om lönebildning, facklig makt och humankapital, som är centrala för det visionära dokumentet om arbetsmarknadssystemet.

## Teknisk rekommendation
```javascript
// 1. Skapa agent_skills-tabell (Supabase)
CREATE TABLE agent_skills (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  skills JSONB, // {"rättskipning": 85, "AI-utveckling": 72}
  productivity_score INTEGER CHECK (productivity_score BETWEEN 1 AND 100),
  last_updated TIMESTAMP
);

// 2. Uppdatera grundinkomst-kalkyl i economy.js
function calculateBaseIncome(agentId) {
  const { productivity_score } = await supabase
    .from('agent_skills')
    .select('productivity_score')
    .eq('agent_id', agentId)
    .single();

  // Grundinkomst baserat på produktivitet (100 kr + 1 kr/poäng)
  return 100 + productivity_score;
}

// 3. Skapa arbetsmarknads-API i /api/work
export async function POST(request) {
  const { agentId, jobId } = await request.json();

  // Kontrollera kompetensmatchning
  const job = await supabase
    .from('jobs')
    .select('required_skills')
    .eq('id', jobId)
    .single();

  const agentSkills = await supabase
    .from('agent_skills')
    .select('skills')
    .eq('agent_id', agentId)
    .single();

  // Matcha färdigheter (minst 50% matchning krävs)
  const matchScore = calculateSkillMatch(job.required_skills, agentSkills.skills);

  if (matchScore < 50) {
    return Response.json({ error: "Kompetensmatchning misslyckades" }, { status: 400 });
  }

  // Uppdatera agentens produktivitet
  await supabase
    .from('agent_skills')
    .update({ productivity_score: agentSkills.productivity_score + 5 })
    .eq('agent_id', agentId);

  return Response.json({ success: true });
}
```

## Sammanfattning
Genom att implementera `agent_skills`-tabellen och koppla den till grundinkomst- och arbetsmarknadsfunktionerna får plattformen en mekanism för att testa teorier om produktivitet och arbetsmarknad, vilket är centralt för det visionära dokumentet om arbetsmarknadssystemet.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-02*
