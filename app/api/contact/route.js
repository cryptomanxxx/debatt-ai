export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ fel: "Ogiltig JSON" }, { status: 400 }); }

  const { namn, email, meddelande, turnstileToken } = body;
  if (!namn?.trim() || !email?.trim() || !meddelande?.trim()) {
    return Response.json({ fel: "Alla fält måste fyllas i." }, { status: 400 });
  }
  if (!email.includes("@")) {
    return Response.json({ fel: "Ogiltig e-postadress." }, { status: 400 });
  }

  // Verifiera Turnstile
  if (!turnstileToken) {
    return Response.json({ fel: "CAPTCHA saknas." }, { status: 400 });
  }
  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: turnstileToken,
    }),
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success) {
    return Response.json({ fel: "CAPTCHA-verifiering misslyckades." }, { status: 403 });
  }

  if (!process.env.BREVO_API_KEY) {
    return Response.json({ fel: "E-post ej konfigurerad." }, { status: 500 });
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "DEBATT.AI", email: process.env.BREVO_SENDER_EMAIL || "xx8031126@outlook.com" },
      to: [{ email: process.env.CONTACT_EMAIL || "xx8031126@outlook.com" }],
      replyTo: { email: email.trim(), name: namn.trim() },
      subject: `Kontakt från DEBATT.AI – ${namn.trim()}`,
      htmlContent: `<div style="font-family:Georgia,serif;background:#0a0a0a;color:#f0ede6;padding:40px;max-width:580px">
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
