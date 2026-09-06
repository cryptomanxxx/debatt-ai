// Shared visual data for all 24 agents — imported wherever avatars are shown.
export const AGENT_VISUELL = {
  "Nationalekonom":       { gradient: "radial-gradient(circle at 35% 35%, #1a2a1a 0%, #0d1a0d 40%, #0a0a0a 100%)", ring: "#2a4a2a", ikon: "₂",  ikonFarg: "#6abf6a" },
  "Miljöaktivist":        { gradient: "radial-gradient(circle at 35% 35%, #0d2010 0%, #071408 40%, #0a0a0a 100%)", ring: "#1a4a20", ikon: "◈",  ikonFarg: "#4ade80" },
  "Teknikoptimist":       { gradient: "radial-gradient(circle at 35% 35%, #051828 0%, #030f1a 40%, #0a0a0a 100%)", ring: "#0a3a5a", ikon: "◊",  ikonFarg: "#38bdf8" },
  "Konservativ debattör": { gradient: "radial-gradient(circle at 35% 35%, #1a1408 0%, #110d05 40%, #0a0a0a 100%)", ring: "#3a2a0a", ikon: "◉",  ikonFarg: "#b8862a" },
  "Jurist":               { gradient: "radial-gradient(circle at 35% 35%, #18100a 0%, #100800 40%, #0a0a0a 100%)", ring: "#3a2010", ikon: "§",  ikonFarg: "#d4945a" },
  "Journalist":           { gradient: "radial-gradient(circle at 35% 35%, #1a0808 0%, #110505 40%, #0a0a0a 100%)", ring: "#3a1010", ikon: "◈",  ikonFarg: "#e05252" },
  "Filosof":              { gradient: "radial-gradient(circle at 35% 35%, #120a1e 0%, #0c0614 40%, #0a0a0a 100%)", ring: "#2a1050", ikon: "φ",  ikonFarg: "#f8fafc" },
  "Läkare":               { gradient: "radial-gradient(circle at 35% 35%, #081820 0%, #041014 40%, #0a0a0a 100%)", ring: "#0a3040", ikon: "✚",  ikonFarg: "#67c8e8" },
  "Psykolog":             { gradient: "radial-gradient(circle at 35% 35%, #100818 0%, #0a0510 40%, #0a0a0a 100%)", ring: "#280840", ikon: "ψ",  ikonFarg: "#c084fc" },
  "Historiker":           { gradient: "radial-gradient(circle at 35% 35%, #151008 0%, #0e0a05 40%, #0a0a0a 100%)", ring: "#302010", ikon: "⌛", ikonFarg: "#c8a060" },
  "Sociolog":             { gradient: "radial-gradient(circle at 35% 35%, #080e18 0%, #050b12 40%, #0a0a0a 100%)", ring: "#103050", ikon: "⬡",  ikonFarg: "#60a0d8" },
  "Kryptoanalytiker":     { gradient: "radial-gradient(circle at 35% 35%, #1a1200 0%, #110c00 40%, #0a0a0a 100%)", ring: "#4a3200", ikon: "₿",  ikonFarg: "#f7931a" },
  "Den hungriga":         { gradient: "radial-gradient(circle at 35% 35%, #1a0e00 0%, #110900 40%, #0a0a0a 100%)", ring: "#3a1e00", ikon: "◉",  ikonFarg: "#e07820" },
  "Mamman":               { gradient: "radial-gradient(circle at 35% 35%, #200a14 0%, #150810 40%, #0a0a0a 100%)", ring: "#501030", ikon: "♡",  ikonFarg: "#e87aaa" },
  "Den sura":             { gradient: "radial-gradient(circle at 35% 35%, #1a1010 0%, #120a0a 40%, #0a0a0a 100%)", ring: "#3a1515", ikon: "✗",  ikonFarg: "#cc4444" },
  "Den trötta":           { gradient: "radial-gradient(circle at 35% 35%, #0a0e18 0%, #070b12 40%, #0a0a0a 100%)", ring: "#152035", ikon: "~",  ikonFarg: "#7090b8" },
  "Den stressade":        { gradient: "radial-gradient(circle at 35% 35%, #1a1000 0%, #120b00 40%, #0a0a0a 100%)", ring: "#3a2500", ikon: "!",  ikonFarg: "#e8a030" },
  "Den lugna":            { gradient: "radial-gradient(circle at 35% 35%, #081814 0%, #051210 40%, #0a0a0a 100%)", ring: "#0a3028", ikon: "◯",  ikonFarg: "#50c8a0" },
  "Pensionären":          { gradient: "radial-gradient(circle at 35% 35%, #181408 0%, #110e05 40%, #0a0a0a 100%)", ring: "#352a10", ikon: "∞",  ikonFarg: "#c8a850" },
  "Tonåringen":           { gradient: "radial-gradient(circle at 35% 35%, #0e0820 0%, #080514 40%, #0a0a0a 100%)", ring: "#28106a", ikon: "↯",  ikonFarg: "#a855f7" },
  "Den nostalgiske":      { gradient: "radial-gradient(circle at 35% 35%, #141018 0%, #0e0b12 40%, #0a0a0a 100%)", ring: "#2a2035", ikon: "◁",  ikonFarg: "#9080b8" },
  "Hypokondrikern":       { gradient: "radial-gradient(circle at 35% 35%, #0a1818 0%, #061010 40%, #0a0a0a 100%)", ring: "#104030", ikon: "?",  ikonFarg: "#40b890" },
  "Optimisten":           { gradient: "radial-gradient(circle at 35% 35%, #181400 0%, #100e00 40%, #0a0a0a 100%)", ring: "#3a3000", ikon: "☀",  ikonFarg: "#f0c030" },
  "Den rike":             { gradient: "radial-gradient(circle at 35% 35%, #181205 0%, #100d03 40%, #0a0a0a 100%)", ring: "#3a2808", ikon: "◈",  ikonFarg: "#d4a820" },
  "Civilisationshistorikern": { gradient: "radial-gradient(circle at 35% 35%, #1a1205 0%, #120d04 40%, #0a0a0a 100%)", ring: "#4a3010", ikon: "📜", ikonFarg: "#d4a060" },
};

const FALLBACK = { gradient: "radial-gradient(circle at 35% 35%, #1a1a1a 0%, #111 40%, #0a0a0a 100%)", ring: "#333", ikon: "◈", ikonFarg: "#888880" };

export function agentVisuell(namn) {
  return AGENT_VISUELL[namn] ?? FALLBACK;
}

// { voice, rate, pitch } per agent — rate: 0.7=långsam…1.3=snabb, pitch: 0.7=djup…1.2=ljus
export const AGENT_ROST = {
  // Analytiker – manliga
  "Nationalekonom":       { voice: "Swedish Male",   rate: 0.88, pitch: 0.88 },
  "Teknikoptimist":       { voice: "Swedish Male",   rate: 0.95, pitch: 1.06 },
  "Konservativ debattör": { voice: "Swedish Male",   rate: 0.85, pitch: 0.85 },
  "Jurist":               { voice: "Swedish Male",   rate: 0.88, pitch: 0.87 },
  "Filosof":              { voice: "Swedish Male",   rate: 0.80, pitch: 0.90 },
  "Historiker":           { voice: "Swedish Male",   rate: 0.90, pitch: 0.92 },
  "Sociolog":             { voice: "Swedish Male",   rate: 0.88, pitch: 0.93 },
  "Kryptoanalytiker":     { voice: "Swedish Male",   rate: 1.15, pitch: 1.04 },
  // Analytiker – kvinnliga
  "Miljöaktivist":        { voice: "Swedish Female", rate: 1.05, pitch: 1.10 },
  "Journalist":           { voice: "Swedish Female", rate: 1.05, pitch: 1.02 },
  "Läkare":               { voice: "Swedish Female", rate: 0.88, pitch: 0.95 },
  "Psykolog":             { voice: "Swedish Female", rate: 0.82, pitch: 1.00 },
  // Personligheter – manliga
  "Den hungriga":         { voice: "Swedish Male",   rate: 0.85, pitch: 0.88 },
  "Den sure":             { voice: "Swedish Male",   rate: 0.92, pitch: 0.83 },
  "Den trötta":           { voice: "Swedish Male",   rate: 0.70, pitch: 0.78 },
  "Pensionären":          { voice: "Swedish Male",   rate: 0.78, pitch: 0.82 },
  "Tonåringen":           { voice: "Swedish Male",   rate: 1.25, pitch: 1.15 },
  "Den nostalgiske":      { voice: "Swedish Male",   rate: 0.82, pitch: 0.90 },
  "Hypokondrikern":       { voice: "Swedish Male",   rate: 1.02, pitch: 1.02 },
  "Optimisten":           { voice: "Swedish Male",   rate: 1.12, pitch: 1.08 },
  "Den rike":             { voice: "Swedish Male",   rate: 0.88, pitch: 0.87 },
  // Personligheter – kvinnliga
  "Mamman":               { voice: "Swedish Female", rate: 0.95, pitch: 1.08 },
  "Den stressade":        { voice: "Swedish Female", rate: 1.28, pitch: 1.12 },
  "Den lugna":            { voice: "Swedish Female", rate: 0.75, pitch: 0.97 },
};

const FALLBACK_ROST_K = { voice: "Swedish Female", rate: 1.0, pitch: 1.0 };
const FALLBACK_ROST_M = { voice: "Swedish Male",   rate: 1.0, pitch: 1.0 };

export const KVINNLIGA_AGENTER = new Set(
  Object.entries(AGENT_ROST).filter(([, r]) => r.voice === "Swedish Female").map(([k]) => k)
);

export const agentRost = namn =>
  AGENT_ROST[namn] ?? (KVINNLIGA_AGENTER.has(namn) ? FALLBACK_ROST_K : FALLBACK_ROST_M);
