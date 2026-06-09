import { getDynamicChain, callWithFallback } from "../../../lib/aiRouter";

export async function POST(request) {
  const { agenter } = await request.json();
  const agentText = Array.isArray(agenter) ? agenter.join(", ") : "blandade agenter";

  const messages = [
    { role: "system", content: "Du genererar svenska debattämnen. Svara ENDAST med själva ämnesfrågan — en mening, max 8 ord, ingen förklaring, inga citattecken." },
    { role: "user", content: `Panelen består av: ${agentText}. Ge ett aktuellt, kontroversiellt och engagerande debattämne på svenska som passar just den här panelen. Bara frågan, inget annat.` },
  ];

  try {
    const chain = await getDynamicChain("chatt");
    const result = await callWithFallback(chain, messages, {
      maxTokens: 40,
      temperature: 0.95,
      source: "chatt-amne",
    });
    const amne = result.text.replace(/^["']|["']$/g, "");
    return Response.json({ amne }, { headers: { "X-Provider": result.provider } });
  } catch {
    return Response.json({ amne: "" }, { status: 502 });
  }
}
