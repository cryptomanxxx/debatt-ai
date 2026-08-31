// Delad etikett för vilken AI-modell som genererade en direktdebatt-replik.
// Håll denna i synk med den faktiska model-strängen i app/api/chatt/route.js —
// en tidigare version av denna etikett sa "Llama 3.3" trots att routen redan
// hade bytt till "openai/gpt-oss-120b" (Codex P2, PR #1285), vilket lät fel i
// två separata sidor eftersom mappningen var duplicerad istället för delad.
export function chattProviderLabel(provider) {
  if (!provider) return null;
  if (provider === "groq") return "Groq · GPT-OSS 120B";
  if (provider === "gemini") return "Gemini · Flash";
  return "Groq + Gemini";
}
