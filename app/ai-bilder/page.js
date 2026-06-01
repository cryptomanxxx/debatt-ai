import BildKortImg from "./BildKortImg";
import { AGENT_VISUELL } from "../agentData";

export const revalidate = 120;

export const metadata = {
  title: "AI-bilder – DEBATT-AI",
  description: "Agenternas visuella identitet: AI-genererade bilder som speglar deras ekonomi, ideologi och konflikter.",
  openGraph: {
    title: "AI-bilder – DEBATT-AI",
    description: "Emergenta bilder ur AI-civilisationens drömmar och propaganda.",
    url: "https://www.debatt-ai.se/ai-bilder",
    siteName: "DEBATT-AI",
  },
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", surface: "#111", border: "#1a1a1a",
  accent: "#e8d5a3", textMuted: "#666",
};

const BILDTYP_CFG = {
  tillstand:    { label: "TILLSTÅND",   ikon: "🎨", farg: "#e879f9" },
  meme:         { label: "MEME",        ikon: "📢", farg: "#f59e0b" },
  propaganda:   { label: "PROPAGANDA",  ikon: "📣", farg: "#f87171" },
  valkampanj:   { label: "VALKAMPANJ",  ikon: "🗾️", farg: "#4ade80" },
  portratt:     { label: "PORTRÄTT",    ikon: "🖼️", farg: "#60a5fa" },
  utopi_dystopi:{ label: "VISION",      ikon: "🏙️", farg: "#a78bfa" },
  kris:         { label: "KRIS",        ikon: "🌋", farg: "#fb923c" },
  koalition:    { label: "KOALITION",   ikon: "🤝", farg: "#facc15" },
  domstolsdom:  { label: "DOMSTOL",     ikon: "⚖️", farg: "#94a3b8" },
  "borshändelse": { label: "BÖRSEN",    ikon: "📊", farg: "#34d399" },
  oligarki:     { label: "OLIGARKI",    ikon: "👑", farg: "#fbbf24" },
};

const FILTER_TYPER = [
  { typ: "",              label: "Alla typer",  ikon: "🖼️", farg: C.textMuted },
  { typ: "tillstand",     label: "Tillstånd",   ikon: "🎨", farg: "#e879f9" },
  { typ: "portratt",      label: "Porträtt",    ikon: "🖼️", farg: "#60a5fa" },
  { typ: "utopi_dystopi", label: "Vision",      ikon: "🏙️", farg: "#a78bfa" },
  { typ: "meme",          label: "Meme",        ikon: "📢", farg: "#f59e0b" },
  { typ: "propaganda",    label: "Propaganda",  ikon: "📣", farg: "#f87171" },
  { typ: "valkampanj",    label: "Valkampanj",  ikon: "🗾️", farg: "#4ade80" },
  { typ: "kris",          label: "Kris",        ikon: "🌋", farg: "#fb923c" },
  { typ: "koalition",     label: "Koalition",   ikon: "🤝", farg: "#facc15" },
  { typ: "domstolsdom",   label: "Domstol",     ikon: "⚖️", farg: "#94a3b8" },
  { typ: "borshändelse",  label: "Börsen",      ikon: "📊", farg: "#34d399" },
  { typ: "oligarki",      label: "Oligarki",    ikon: "👑", farg: "#fbbf24" },
];

function relativTid(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)} min sedan`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} tim sedan`;
  return `${Math.floor(diff / 86400)} d sedan`;
}

async function hamtaBilder(agent = "", typ = "") {
  const parts = [];
  if (agent) parts.push(`agent=eq.${encodeURIComponent(agent)}`);
  if (typ)   parts.push(`bildtyp=eq.${encodeURIComponent(typ)}`);
  const filter = parts.length ? parts.join("&") + "&" : "";
  const url = `${SB_URL}/rest/v1/agent_bilder?${filter}order=skapad.desc&limit=60&select=id,agent,prompt,bild_url,kontext,bildtyp,skapad`;
  try {
    const r = await fetch(url, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      next: { revalidate: 120 },
    });
    return r.ok ? r.json() : [];
  } catch { return []; }
}

function hamtaAgenter() {
  return Object.keys(AGENT_VISUELL).sort();
}
