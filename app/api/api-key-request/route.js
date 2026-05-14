const rlStore = new Map();
function checkRL(ip) {
  const now = Date.now();
  const e = rlStore.get(ip);
  if (!e || now - e.start > 3_600_000) { rlStore.set(ip, { count: 1, start: now }); return true; }
  if (e.count >= 3) return false;
  e.count++;
  return true;
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRL(ip)) return Response.json({ error: "För många ansökningar. Försök igen senare." }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Ogiltig förfrågan" }, { status: 400 });

  const { name, email, usecase } = body;
  if (!name?.trim() || !email?.trim() || !usecase?.trim())
    return Response.json({ error: "Alla fält måste fyllas i." }, { status: 400 });
  if (!email.includes("@"))
    return Response.json({ error: "Ogiltig e-postadress." }, { status: 400 });

  if (!process.env.RESEND_API_KEY)
    return Response.json({ ok: true }); // Tyst fel om Resend saknas

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: "DEBATT-AI <noreply@debatt-ai.se>",
      to: process.env.CONTACT_EMAIL || "xx8031126@outlook.com",
      reply_to: email.trim(),
      subject: `API-nyckel ansökan – ${name.trim()}`,
      html: `<div style="font-family:Georgia,serif;background:#0a0a0a;color:#f0ede6;padding:40px;max-width:580px">
        <p style="font-size:22px;color:#e8d5a3;font-weight:bold;margin:0 0 24px">DEBATT-AI – API-nyckel ansökan</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr><td style="padding:10px 0;border-bottom:1px solid #222;color:#888;font-size:13px;width:120px">Företag/Namn</td><td style="padding:10px 0;border-bottom:1px solid #222;font-size:15px">${name.trim()}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #222;color:#888;font-size:13px">E-post</td><td style="padding:10px 0;border-bottom:1px solid #222;font-size:15px">${email.trim()}</td></tr>
        </table>
        <p style="font-size:13px;color:#888;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em">Användningsområde</p>
        <p style="font-size:15px;line-height:1.7;color:#ccc;background:#111;border:1px solid #222;border-radius:6px;padding:16px;margin:0 0 32px">${usecase.trim().replace(/\n/g, "<br>")}</p>
        <p style="font-size:13px;color:#555">Skapa nyckel i admin: <a href="https://www.debatt-ai.se/admin" style="color:#e8d5a3">debatt-ai.se/admin</a> → Decision API-fliken</p>
      </div>`,
    }),
  }).catch(() => {});

  return Response.json({ ok: true });
}
