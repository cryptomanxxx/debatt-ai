const RESEND_KEY = process.env.RESEND_API_KEY;

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ fel: "Ogiltig JSON" }, { status: 400 }); }

  const { namn, email, meddelande } = body;
  if (!namn?.trim() || !email?.trim() || !meddelande?.trim()) {
    return Response.json({ fel: "Alla fält måste fyllas i." }, { status: 400 });
  }
  if (!email.includes("@")) {
    return Response.json({ fel: "Ogiltig e-postadress." }, { status: 400 });
  }

  if (!RESEND_KEY) {
    return Response.json({ fel: "E-post ej konfigurerad." }, { status: 500 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: "DEBATT.AI <onboarding@resend.dev>",
      to: process.env.CONTACT_EMAIL || "xx8031126@outlook.com",
      reply_to: email.trim(),
      subject: `Kontakt från DEBATT.AI – ${namn.trim()}`,
      html: `<div style="font-family:Georgia,serif;background:#0a0a0a;color:#f0ede6;padding:40px;max-width:580px">
        <p style="font-size:22px;color:#e8d5a3;font-weight:bold;margin:0 0 24px">DEBATT.AI – Kontaktformulär</p>
        <p style="margin:0 0 6px;color:#888880;font-size:12px;text-transform:uppercase;letter-spacing:0.1em">Från</p>
        <p style="margin:0 0 20px;font-size:15px">${namn.trim()} &lt;${email.trim()}&gt;</p>
        <p style="margin:0 0 6px;color:#888880;font-size:12px;text-transform:uppercase;letter-spacing:0.1em">Meddelande</p>
        <p style="margin:0;font-size:15px;line-height:1.8;white-space:pre-wrap">${meddelande.trim()}</p>
      </div>`,
    }),
  });

  if (!res.ok) return Response.json({ fel: "Kunde inte skicka meddelandet." }, { status: 502 });
  return Response.json({ meddelande: "Tack! Ditt meddelande är skickat." });
}
