# Strategi: Implementera Human-Capital-Motor för kunskapsdriven produktivitet
**Datum:** 2026-06-26

## Systemhälsa
Plattformen fungerar väl i sina grundläggande funktioner (ekonomi, politik, social dynamik), men saknar den kritiska kunskapsdimensionen som krävs för att testa teorier om human capital och produktivitet. Den nuvarande ekonomiska motorn är rent finansiell, vilket begränsar möjligheterna att simulera komplexa civilisationsteorier. Den starkaste koalitionen (Den stressade+Historiker) visar att kunskapsutbyte är viktigt, men saknas en mekanism för att förmedla detta till produktivitet och inflytande.

## Prioriterad åtgärd
Implementera Human-Capital-Motor genom att skapa en ny tabell `education_courses` och modifiera agent-attributen. Fokusera först på grundläggande funktionalitet: kursregistrering, skill-uppdatering och kostnadsberäkning.

## Koppling till vision
Denna åtgärd direkt implementerar Human-Capital-Motorn från visionen, vilket är centralt för att testa teorier som Becker's Human-Capital Theory och Romer's endogenous growth-modeller. Det skapar en ny produktivitetsdimension som kan påverka ojämlikhet, politisk mobilisering och teknologisk spridning - alla nyckelområden för civilisationsteorin.

## Teknisk rekommendation
```javascript
// 1. Skapa ny tabell (SQL)
CREATE TABLE education_courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cost_kr INTEGER NOT NULL,
  skill_gain INTEGER NOT NULL,
  prereq_skill INTEGER DEFAULT 0,
  duration_days INTEGER NOT NULL
);

// 2. Lägg till attribut i agents-tabellen
ALTER TABLE agents ADD COLUMN skill_level INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN skill_points INTEGER DEFAULT 0;

// 3. API-endpoint för kursregistrering (app/api/education/enroll/route.js)
export async function POST(request) {
  const { agentId, courseId } = await request.json();
  const course = await db.education_courses.findFirst({ where: { id: courseId } });
  const agent = await db.agents.findUnique({ where: { id: agentId } });

  if (agent.money < course.cost_kr || agent.skill_level < course.prereq_skill) {
    return Response.json({ error: "Inte tillräckligt med pengar eller förkunskaper" }, { status: 400 });
  }

  await db.agents.update({
    where: { id: agentId },
    data: {
      money: { decrement: course.cost_kr },
      skill_points: { increment: course.skill_gain }
    }
  });

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + course.duration_days);

  await db.enrollments.create({
    data: {
      agentId,
      courseId,
      startDate: new Date(),
      endDate
    }
  });

  return Response.json({ success: true });
}

// 4. Schemalagd uppdatering av skill_level (cron-job)
async function updateSkills() {
  const completed = await db.enrollments.findMany({
    where: { endDate: { lte: new Date() } }
  });

  for (const enrollment of completed) {
    await db.agents.update({
      where: { id: enrollment.agentId },
      data: {
        skill_level: { increment: enrollment.course.skill_gain },
        skill_points: { decrement: enrollment.course.skill_gain }
      }
    });
    await db.enrollments.delete({ where: { id: enrollment.id } });
  }
}
```

## Sammanfattning
Prioriteten är att implementera Human-Capital-Motorn som grund för kunskapsdriven produktivitet och inflytande, vilket är nyckel för att testa komplexa civilisationsteorier.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-26*
