const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ fel: "Invalid JSON" }, { status: 400 }); }

  const { namn, land, github_url, hemsida_url, beskrivning, kontakt_email } = body;
  if (!namn?.trim() || !land?.trim()) {
    return Response.json({ fel: "Name and country are required." }, { status: 400 });
  }

  const res = await fetch(`${SB_URL}/rest/v1/community_civilisationer`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      namn: namn.trim(),
      land: land.trim(),
      github_url: github_url?.trim() || null,
      hemsida_url: hemsida_url?.trim() || null,
      beskrivning: beskrivning?.trim() || null,
      kontakt_email: kontakt_email?.trim() || null,
      status: "pending",
      verifierad: false,
    }),
  });

  if (!res.ok) return Response.json({ fel: "Could not save registration." }, { status: 502 });

  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "DEBATT-AI <noreply@debatt-ai.se>",
        to: process.env.CONTACT_EMAIL || "xx8031126@outlook.com",
        subject: `New civilization registered: ${namn.trim()}`,
        html: `<div style="font-family:Georgia,serif;background:#0a0a0a;color:#f0ede6;padding:32px;max-width:520px">
          <p style="font-size:18px;color:#e8d5a3;margin:0 0 20px">New civilization registered</p>
          <p><strong>${namn.trim()}</strong> — ${land.trim()}</p>
          ${github_url ? `<p>GitHub: <a href="${github_url}" style="color:#b8a57a">${github_url}</a></p>` : ""}
          ${hemsida_url ? `<p>Website: <a href="${hemsida_url}" style="color:#b8a57a">${hemsida_url}</a></p>` : ""}
          ${kontakt_email ? `<p>Contact: ${kontakt_email}</p>` : ""}
          ${beskrivning ? `<p style="color:#888">${beskrivning}</p>` : ""}
        </div>`,
      }),
    }).catch(() => {});
  }

  return Response.json({ ok: true });
}
