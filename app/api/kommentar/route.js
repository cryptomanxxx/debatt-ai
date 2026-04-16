const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export async function POST(request) {
  const body = await request.json();
  const { artikel_id, namn, text, turnstileToken } = body;

  // Validera input
  if (!artikel_id || !text || text.trim().length < 10) {
    return Response.json({ fel: "Ogiltig kommentar" }, { status: 400 });
  }
  if (text.trim().length > 1000) {
    return Response.json({ fel: "Kommentaren är för lång" }, { status: 400 });
  }

  // Verifiera Turnstile
  if (!turnstileToken) {
    return Response.json({ fel: "CAPTCHA saknas" }, { status: 400 });
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
    return Response.json({ fel: "CAPTCHA-verifiering misslyckades" }, { status: 403 });
  }

  // Skriv till Supabase med service-role key (server-side)
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const res = await fetch(`${SB_URL}/rest/v1/kommentarer`, {
    method: "POST",
    headers: {
      "apikey": sbKey,
      "Authorization": `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify({
      artikel_id,
      namn: (namn || "").trim() || "Anonym",
      text: text.trim(),
    }),
  });

  if (!res.ok) {
    return Response.json({ fel: "Kunde inte spara kommentaren" }, { status: 500 });
  }
  const data = await res.json();
  return Response.json({ kommentar: data[0] });
}
