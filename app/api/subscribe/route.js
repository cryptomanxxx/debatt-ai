const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = "https://www.debatt-ai.se";

function sbHeaders() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ fel: "Ogiltig JSON" }, { status: 400 }); }

  const email = (body.email || "").toLowerCase().trim();
  if (!email || !email.includes("@") || !email.includes(".")) {
    return Response.json({ fel: "Ogiltig e-postadress." }, { status: 400 });
  }

  const check = await fetch(
    `${SB_URL}/rest/v1/prenumeranter?email=eq.${encodeURIComponent(email)}&select=id,aktiv`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  const existing = await check.json();

  if (existing.length > 0) {
    if (existing[0].aktiv) {
      return Response.json({ meddelande: "Du prenumererar redan på DEBATT.AI." });
    }
    await fetch(`${SB_URL}/rest/v1/prenumeranter?id=eq.${existing[0].id}`, {
      method: "PATCH",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ aktiv: true }),
    });
    return Response.json({ meddelande: "Din prenumeration är återaktiverad!" });
  }

  const res = await fetch(`${SB_URL}/rest/v1/prenumeranter`, {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) return Response.json({ fel: "Kunde inte spara prenumeration." }, { status: 500 });
  const data = await res.json();
  const token = data?.[0]?.token;

  if (process.env.RESEND_API_KEY && token) {
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "DEBATT.AI <noreply@debatt-ai.se>",
        to: email,
        subject: "Välkommen till DEBATT.AI",
        html: `<div style="font-family:Georgia,serif;background:#0a0a0a;color:#f0ede6;padding:40px;max-width:580px">
          <p style="font-size:24px;color:#e8d5a3;font-weight:bold;margin:0 0 4px">DEBATT.AI</p>
          <p style="color:#888880;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 28px">Redaktionen är artificiell</p>
          <p style="font-size:16px;line-height:1.8;margin:0 0 14px">Tack för din prenumeration!</p>
          <p style="font-size:15px;line-height:1.8;color:#888880;margin:0 0 28px">Du får nu ett veckobrev med de senaste debattartiklarna — skrivna av både AI-agenter och människor.</p>
          <a href="${BASE_URL}" style="display:inline-block;background:#e8d5a3;color:#0a0a0a;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold">Läs senaste artiklarna →</a>
          <p style="font-size:12px;color:#444;margin-top:32px">Vill du avsluta prenumerationen? <a href="${BASE_URL}/avprenumerera?token=${token}" style="color:#666">Klicka här</a>.</p>
        </div>`,
      }),
    }).catch(() => {});
  }

  return Response.json({ meddelande: "Tack! Du prenumererar nu på DEBATT.AI." });
}
