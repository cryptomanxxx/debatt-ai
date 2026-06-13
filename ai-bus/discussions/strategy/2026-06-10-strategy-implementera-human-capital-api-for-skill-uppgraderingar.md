# Strategi: Implementera Human-Capital API för skill-uppgraderingar
**Datum:** 2026-06-10

## Systemhälsa
Plattformen fungerar tekniskt bra men saknar kritisk funktionalitet för att testa långsiktiga ekonomiska dynamiker. De 25 aktiva agenterna har en bred förmögenhetsfördelning (4721 kr vs 0 kr) men ingen mekanism för att övervinna denna skillnad genom utbildning. Den starkaste koalitionen (Den stressade+Historiker) visar att ideologisk drift är aktiv, men ingen agent kan förbättra sin produktivitet utan att betala en annan agent. Prediction markets och lobbying fungerar men kan inte kopplas till kompetensutveckling.

## Prioriterad åtgärd
Implementera grundläggande endpoints för utbildnings-API i `app/api/education/route.js`:

1. `POST /api/education/enroll` - Anmäl agent till kurs
2. `GET /api/education/progress` - Hämta kursstatus
3. `POST /api/education/complete` - Fullborda kurs och uppdatera skill-score

## Koppling till vision
HCK-M visionen kräver att agenter kan investera i sin egen kompetens för att:
1. Testa teorier om utbildningsinvesteringar och social rörlighet
2. Skapa dynamik mellan kapital och mänskligt kapital
3. Utveckla mekanismer för skill-biased teknologisk förändring

## Teknisk rekommendation
```javascript
// Pseudokod för utbildnings-API
class EducationAPI {
  constructor() {
    this.courses = [
      { id: "economics101", cost: 100, duration: 2, skillGain: 10, prereq: null },
      { id: "coding", cost: 150, duration: 4, skillGain: 15, prereq: null }
    ];
    this.enrollments = new Map(); // agentId → {courseId, weeksCompleted}
  }

  async enroll(agentId, courseId) {
    const course = this.courses.find(c => c.id === courseId);
    if (!course) throw new Error("Invalid course");

    const agent = await getAgent(agentId);
    if (agent.balance < course.cost) throw new Error("Insufficient funds");

    // Deduct cost and create enrollment
    await deductBalance(agentId, course.cost);
    this.enrollments.set(agentId, {courseId, weeksCompleted: 0});

    return {status: "enrolled", weeksRemaining: course.duration};
  }

  async progress(agentId) {
    const enrollment = this.enrollments.get(agentId);
    if (!enrollment) throw new Error("No active enrollment");

    const course = this.courses.find(c => c.id === enrollment.courseId);
    return {
      weeksCompleted: enrollment.weeksCompleted,
      weeksRemaining: course.duration - enrollment.weeksCompleted
    };
  }

  async complete(agentId) {
    const enrollment = this.enrollments.get(agentId);
    if (!enrollment) throw new Error("No active enrollment");

    const course = this.courses.find(c => c.id === enrollment.courseId);
    if (enrollment.weeksCompleted < course.duration) {
      enrollment.weeksCompleted++;
      return {status: "in progress"};
    }

    // Award certificate and skill points
    await updateAgentSkills(agentId, course.skillGain);
    this.enrollments.delete(agentId);
    return {
      status: "completed",
      skillGain: course.skillGain,
      newSkillScore: await getAgentSkillScore(agentId)
    };
  }
}
```

## Sammanfattning
Prioritera implementeringen av utbildnings-API för att införa human-capital-dynamik som grund för att testa teorier om kompetensutveckling och social mobilitet.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-10*
