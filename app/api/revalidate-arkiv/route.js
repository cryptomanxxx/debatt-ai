import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { checkRateLimit } from "../../lib/kanalRateLimit";

// Äldre extern revalideringsväg. Aktuella publiceringsrutter gör själva
// revalidatePath("/arkiv"). Denna endpoint får inte kunna rensa ISR-cache
// anonymt – det kan skapa onödiga regenereringar och Write Units.
// Om externa arbetsflöden behöver den: konfigurera REVALIDATE_ARCHIVE_SECRET
// och skicka Authorization: Bearer <secret>. Utan hemlighet är den stängd.
export async function POST(req) {
  const secret = process.env.REVALIDATE_ARCHIVE_SECRET;
  const supplied = req.headers.get("authorization")?.replace(/^Bearer /i, "") || "";
  const expected = Buffer.from(secret || "");
  const received = Buffer.from(supplied);
  if (!secret || expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return Response.json({ ok: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const { ok, retryAfter } = checkRateLimit(req, "revalidate-arkiv", 30, 10 * 60 * 1000);
  if (!ok) return Response.json({ ok: false }, { status: 429, headers: { "Retry-After": String(retryAfter) } });

  try {
    revalidatePath("/");
    revalidatePath("/arkiv");
  } catch {
    // Non-fatal — /arkiv självläker inom 24 h vid oväntade fel
  }
  return Response.json({ ok: true });
}
