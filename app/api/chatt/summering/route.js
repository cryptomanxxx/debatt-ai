import { getDynamicChain, callWithFallback } from "../../../lib/aiRouter";

export async function POST(request) {
  const { amne, inlagg } = await request.json();

  if (!inlagg?.length) {
    return Response.json({ summering: "", scores: null });
  }

  const debattText = inlagg.map(h => `${h.agent}: ${h.text}`).join("\n\n");
  const agenter = [...new Set(inlagg.map(h => h.agent))];
  const chain = await getDynamicChain("chatt");

  const [sumResult, scoreResult] = await Promise.allSettled([
    callWithFallback(chain, [
      { role: "system", content: "Du är en neutral redaktör. Sammanfatta debatter kort och balanserat på svenska. Ta aldrig parti." },
      { role: "user", content: `Debatten handlade om: "${amne}"\n\n${debattText}\n\nSammanfatta debatten i exakt 2 meningar. Lyft fram de starkaste argumenten från alla sidor. Neutral ton. Inga värderingar.` },
    ], { maxTokens: 220, temperature: 0.4, source: "chatt-summering" }),

    callWithFallback(chain, [
      { role: "system", content: "Du är en retorisk domare. Svara ENDAST med ett JSON-objekt. Inga förklaringar, ingen text utanför JSON." },
      { role: "user", content: `Debatten handlade om: "${amne}"\n\n${debattText}\n\nGe varje deltagare ett heltalspoäng 1-10 för retorisk förmåga (argumentstyrka, originalitet, övertygande förmåga).\n\nDeltagarna är: ${agenter.map((a, i) => `${i + 1}. ${a}`).join(", ")}\n\nSvara med EXAKT detta format (ersätt talen med dina betyg):\n{"${agenter.join('": X, "')}: X}` },
    ], { maxTokens: 80, temperature: 0.1, json: true, source: "chatt-summering-scores" }),
  ]);

  const summering = sumResult.status === "fulfilled" ? sumResult.value.text.trim() : "";
  const usedProvider = sumResult.status === "fulfilled" ? sumResult.value.provider : "none";

  let scores = null;
  if (scoreResult.status === "fulfilled") {
    try {
      const raw = JSON.parse(scoreResult.value.text || "{}");
      const rawLower = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]));
      scores = {};
      for (const agent of agenter) {
        const v = Number(raw[agent] ?? rawLower[agent.toLowerCase()]);
        if (Number.isInteger(v) && v >= 1 && v <= 10) scores[agent] = v;
      }
      if (Object.keys(scores).length === 0) scores = null;
    } catch {
      scores = null;
    }
  }

  return Response.json({ summering, scores }, {
    headers: { "X-Provider": usedProvider },
  });
}
