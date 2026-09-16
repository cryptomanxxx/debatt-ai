import { revalidatePath } from "next/cache";
import { checkRateLimit } from "../../lib/kanalRateLimit";

// Klientsidan publicerar direkt mot Supabase (anon-nyckel, se app/client.js
// och app/skicka-in/SkickaInClient.js) — ingen server-route i den vägen kan
// annars anropa Next.js egen revalidatePath(). Utan detta serverade /arkivs
// 600s ISR-cache (✅94/PR #1462) den GAMLA artikellistan i upp till 10
// minuter efter en lyckad publicering, även efter en manuell omladdning
// (Codex-fynd, PR #1462-granskning).
export async function POST(req) {
  const { ok, retryAfter } = checkRateLimit(req, "revalidate-arkiv", 30, 10 * 60 * 1000);
  if (!ok) return Response.json({ ok: false }, { status: 429, headers: { "Retry-After": String(retryAfter) } });

  try {
    revalidatePath("/arkiv");
  } catch {
    // Non-fatal — /arkiv självläker inom sitt normala 600s-fönster ändå
  }
  return Response.json({ ok: true });
}
