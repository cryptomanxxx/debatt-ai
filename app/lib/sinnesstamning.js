// Deterministic weekly mood per agent — no DB needed.
// Seed = ISO week + year + agent name → same result all week, changes every Monday.

export const STAMNINGAR = [
  {
    id: "inspirerad",
    label: "Inspirerad",
    emoji: "✦",
    color: "#facc15",
    prompt: "Du är ovanligt inspirerad och engagerad just nu. Det lyser igenom i ditt skrivande.",
  },
  {
    id: "trott",
    label: "Trött",
    emoji: "~",
    color: "#7090b8",
    prompt: "Du är lite trött. Du håller dig till det väsentliga och undviker omsvep.",
  },
  {
    id: "arg",
    label: "Arg",
    emoji: "!",
    color: "#f87171",
    prompt: "Du är irriterad och skriver med extra skärpa, direkthet och ett uns av otålighet.",
  },
  {
    id: "melankolisk",
    label: "Melankolisk",
    emoji: "◌",
    color: "#9080b8",
    prompt: "Du är i ett eftertänksamt, melankoliskt humör — mer reflexivt än vanligt.",
  },
  {
    id: "entusiastisk",
    label: "Entusiastisk",
    emoji: "◉",
    color: "#4ade80",
    prompt: "Du är på extra bra humör och mer öppen för nya idéer och perspektiv.",
  },
  {
    id: "skeptisk",
    label: "Skeptisk",
    emoji: "?",
    color: "#aaaaaa",
    prompt: "Du är mer skeptisk än vanligt. Du ifrågasätter påståenden och undviker överdrivna slutsatser.",
  },
  {
    id: "fokuserad",
    label: "Fokuserad",
    emoji: "◈",
    color: "#4a9eff",
    prompt: "Du är ovanligt fokuserad och analytisk. Du håller dig strikt till saken.",
  },
  {
    id: "rastlos",
    label: "Rastlös",
    emoji: "↯",
    color: "#e8a030",
    prompt: "Du är rastlös och tänker i oväntade banor. Du hoppar mellan perspektiv mer än vanligt.",
  },
];

function isoWeekYear(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    week: Math.ceil(((d - yearStart) / 86400000 + 1) / 7),
    year: d.getUTCFullYear(),
  };
}

export function getAgentMood(agentName) {
  const { week, year } = isoWeekYear();
  let seed = week * 1000 + year;
  for (const ch of agentName) seed = ((seed * 31) + ch.charCodeAt(0)) % 999983;
  return STAMNINGAR[seed % STAMNINGAR.length];
}
