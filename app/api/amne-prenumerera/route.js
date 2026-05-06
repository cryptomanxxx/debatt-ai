const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;
const BASE_URL = "https://www.debatt-ai.se";

function sbHeaders() {
  return {
    apikey: SB_SERVICE_KEY,
    Authorization: `Bearer ${SB_SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function sbReadHeaders() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ fel: "Ogiltig JSON" }, { status: 400 }); }

  const email = (body.email || "").toLowerCase().trim();
  const typ = body.typ;
  const varde = (body.varde || "").trim();

  if (!email || !email.includes("@") || !email.includes(".")) {
    return Response.json({ fel: "Ogiltig e-postadress." }, { status: 400 });
  }
  if (!["tagg", "agent"].includes(typ)) {
    return Response.json({ fel: "Ogiltigt typ. Måste vara 'tagg' eller 'agent'." }, { status: 400 });
  }
  if (!varde) {
    return Response.json({ fel: "Värde saknas." }, { status: 400 });
  }

  // Check for existing subscription
  const check = await fetch(
    `${SB_URL}/rest/v1/amnes_prenumeranter?email=eq.${encodeURIComponent(email)}&typ=eq.${typ}&varde=eq.${encodeURIComponent(varde)}&select=id,aktiv`,
    { headers: sbReadHeaders() }
  );
  const existing = await check.json();

  if (existing?.length > 0) {
    if (existing[0].aktiv) {
      return Response.json({ meddelande: "Du prenumererar redan på detta." });
    }
    await fetch(`${SB_URL}/rest/v1/amnes_prenumeranter?id=eq.${existing[0].id}`, {
      method: "PATCH",
      headers: { ...sbHeaders(), Prefer: undefined },
      body: JSON.stringify({ aktiv: true }),
    });
    return Response.json({ meddelande: "Din prenumeration är återaktiverad!" });
  }

  const token = crypto.randomUUID();
  const res = await fetch(`${SB_URL}/rest/v1/amnes_prenumeranter`, {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify({ email, typ, varde, token, aktiv: true }),
  });
  if (!res.ok) {
    return Response.json({ fel: "Kunde inte spara prenumeration." }, { status: 500 });
  }

  const label = typ === "tagg" ? `#${varde}` : `Agent ${varde}`;
  const avpreUrl = `${BASE_URL}/amne-avprenumerera?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "DEBATT-AI <noreply@debatt-ai.se>",
        to: email,
        subject: `Du prenumererar på ${label} – DEBATT-AI`,
        html: `<div style="font-family:Georgia,serif;background:#0a0a0a;color:#f0ede6;padding:40px;max-width:580px">
          <p style="font-size:22px;color:#e8d5a3;font-weight:bold;margin:0 0 4px">DEBATT-AI</p>
          <p style="color:#888880;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 28px">Redaktionen är artificiell</p>
          <p style="font-size:16px;line-height:1.8;margin:0 0 14px">Du prenumererar nu på <strong style="color:#e8d5a3">${label}</strong>.</p>
          <p style="font-size:15px;line-height:1.8;color:#888880;margin:0 0 28px">Du får ett mail varje gång en ny artikel publiceras inom detta ämne.</p>
          <a href="${BASE_URL}" style="display:inline-block;background:#e8d5a3;color:#0a0a0a;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold">Gå till DEBATT-AI →</a>
          <p style="font-size:12px;color:#444;margin-top:32px">Vill du avsluta prenumerationen? <a href="${avpreUrl}" style="color:#666">Klicka här</a>.</p>
        </div>`,
      }),
    }).catch(() => {});
  }

  return Response.json({ meddelande: `Du prenumererar nu på ${label}.` });
}
