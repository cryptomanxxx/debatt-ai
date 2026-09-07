// Delad logik för att låta en eller flera AI-agenter analysera en nyhet i
// realtid via /api/chatt (typ="nyhetsanalys") — utbruten ur NyhetskallorClient.js
// så samma implementation kan återanvändas av /universitet (Vetenskapliga
// Nyheter-fliken), utan att duplicera streaming/omförsöks-logiken. Ren logik,
// ingen JSX — UI-komponenten (AgentAnalysPanel) ligger i egen fil per sida
// eftersom färgtemat skiljer sig mellan /nyhetskallor och /universitet.

export const ALLA_AGENTER = [
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
  "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
  "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
];

export const AGENT_FARG = {
  "Nationalekonom":"#6abf6a","Miljöaktivist":"#4ade80","Teknikoptimist":"#38bdf8",
  "Konservativ debattör":"#b8862a","Jurist":"#d4945a","Journalist":"#f8fafc",
  "Filosof":"#e879f9","Läkare":"#f87171","Psykolog":"#f8fafc",
  "Historiker":"#f8fafc","Sociolog":"#34d399","Kryptoanalytiker":"#f59e0b",
  "Den hungriga":"#86efac","Mamman":"#f9a8d4","Den sura":"#94a3b8",
  "Den trötta":"#7dd3fc","Den stressade":"#fca5a5","Den lugna":"#a7f3d0",
  "Pensionären":"#d8b4fe","Tonåringen":"#fdba74","Den nostalgiske":"#fde68a",
  "Hypokondrikern":"#6ee7b7","Optimisten":"#fcd34d","Den rike":"#c4b5fd",
};

export function af(namn, fallback = "#38bdf8") {
  return AGENT_FARG[namn] || fallback;
}

// En avbruten leverantörsström lämnar inte alltid text helt tom — samma heuristik
// som Direktdebatten använder för att upptäcka avhuggna svar (se app/chatt/page.js).
export function arTroligenAvbruten(text) {
  const t = (text || "").trim();
  if (t.length < 20) return true;
  return !/[.!?…][”"')\]]*$/.test(t);
}

export async function streamAgentAnalys({ agent, amne, artikelTitel, artikelSammanfattning, hoppaOverGroq, nyhetId, requestId, onToken, signal }) {
  const res = await fetch("/api/chatt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ typ: "nyhetsanalys", amne, historik: [], agent, artikelTitel, artikelSammanfattning, hoppaOverGroq, nyhetId, requestId }),
    signal,
  });
  if (!res.ok || !res.body) {
    const status = res.status;
    const errBody = await res.text().catch(() => "");
    throw Object.assign(new Error(`HTTP ${status}: ${errBody.slice(0, 120)}`), { status });
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "", buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") return { text, klar: true };
        try {
          const token = JSON.parse(raw).choices?.[0]?.delta?.content ?? "";
          if (token) { text += token; onToken(text); }
        } catch { /* ignore */ }
      }
    }
  } catch (e) { if (e.name !== "AbortError") throw e; }
  return { text, klar: false };
}

// Ett omförsök hoppar förbi Groq (samma resonemang som Direktdebattens retry-logik):
// en avhuggen ström beror oftast på Groqs streaming, inte på ämnet/agenten.
//
// requestId genereras EN gång per klick (utanför omförsöksloopen) och skickas
// med på VARJE försök av detta klick — servern upsertar på (nyhet_id, agent,
// request_id), så ett omförsök av SAMMA klick ersätter den första (ofta
// avhuggna) versionen istället för att dubbleras, men ett SENARE, oberoende
// klick på samma agent+nyhet (en annan besökare, eller samma besökare en
// annan dag) får en ny requestId och skriver en egen rad istället för att
// tyst skriva över en tidigare arkiverad analys (Codex-fynd, se
// supabase_nyhetsanalys_v3.sql).
export async function analyseraMedAgent(agent, n, uppdatera) {
  const requestId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  // n.rubrik kan vara upp till 300 tecken (nyhetsflode_test.py klipper vid
  // [:300]) men /api/chatt avvisar amne > 200 tecken med ett 400-fel
  // (Codex-fynd, PR #1401-granskning) — utan klippning misslyckades varje
  // analysförsök på en historisk rad med en lång rubrik, för alla agenter,
  // med bara ett generiskt "Något gick fel."
  const amneSakert = (n.rubrik || "").slice(0, 200);
  let text = null, klar = false;
  for (let forsok = 0; forsok < 2 && (!klar || arTroligenAvbruten(text)); forsok++) {
    if (forsok > 0) await new Promise(r => setTimeout(r, 400));
    try {
      const resultat = await streamAgentAnalys({
        agent, amne: amneSakert, artikelTitel: n.rubrik, artikelSammanfattning: n.beskrivning,
        hoppaOverGroq: forsok > 0, nyhetId: n.id, requestId,
        onToken: (t) => uppdatera({ status: "laddar", text: t }),
      });
      text = resultat.text;
      klar = resultat.klar;
    } catch (e) {
      uppdatera({ status: "fel", text: e.status === 429 ? "För många analyser just nu — försök igen om en stund." : "Något gick fel." });
      return;
    }
  }
  uppdatera({ status: text ? "klar" : "fel", text: text || "Kunde inte hämta ett svar." });
}
