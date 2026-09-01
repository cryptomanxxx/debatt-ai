// Delad etikett för vilken/vilka AI-modeller som genererade en direktdebatts repliker.
// Håll NAMN i synk med den faktiska model-strängen i app/api/chatt/route.js —
// en tidigare version av denna etikett sa "Llama 3.3" trots att routen redan
// hade bytt till "openai/gpt-oss-120b" (Codex P2, PR #1285), vilket lät fel i
// två separata sidor eftersom mappningen var duplicerad istället för delad.
//
// Byggs generellt utifrån EN ELLER FLERA "+"-separerade providernamn (t.ex.
// "groq+codestral"), inte bara de tidigare hårdkodade groq/gemini-kombinationerna
// — sedan ett omförsök efter en avhuggen Groq-ström numera kan hamna hos Codestral
// lika gärna som Gemini (se hoppaOverGroq i app/chatt/page.js), skulle en debatt
// där det händer annars sparas/visas som ren Groq-debatt trots att Codestral
// genererat den behållna repliken (Codex P2, PR #1288).
const NAMN = {
  groq: "Groq · GPT-OSS 120B",
  codestral: "Codestral",
  gemini: "Gemini · Flash",
};

export function chattProviderLabel(provider) {
  if (!provider) return null;
  return provider.split("+").map((p) => NAMN[p] ?? p).join(" + ");
}
