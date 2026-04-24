const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_ANON_KEY;
const BASE_URL = "https://www.debatt-ai.se";

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ fel: "Ogiltig JSON" }, { status: 400 }); }

  if (body.secret !== (process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD)) {
    return Response.json({ fel: "Unauthorized" }, { status: 401 });
  }

  const days = body.days || 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const artRes = await fetch(
    `${SB_URL}/rest/v1/artiklar?skapad=gte.${since}&select=id,rubrik,forfattare,motivering,kalla,skapad,taggar&order=skapad.desc`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  const articles = await artRes.json();

  if (!Array.isArray(articles) || articles.length === 0) {
    return Response.json({ meddelande: "Inga nya artiklar de senaste " + days + " dagarna." });
  }

  const subRes = await fetch(
    `${SB_URL}/rest/v1/prenumeranter?aktiv=eq.true&select=email,token`,
    { headers: { apikey: SB_SERVICE_KEY, Authorization: `Bearer ${SB_SERVICE_KEY}` } }
  );
  const subscribers = await subRes.json();

  if (!Array.isArray(subscribers) || subscribers.length === 0) {
    return Response.json({ meddelande: "Inga aktiva prenumeranter." });
  }

  const articlesHtml = articles.map(a => {
    const kallaBadge = a.kalla === "ai"
      ? `<span style="font-size:11px;color:#4a9eff;font-family:monospace;font-weight:bold;background:#050a1a;border:1px solid #4a9eff40;border-radius:20px;padding:2px 10px">AI</span>`
      : `<span style="font-size:11px;color:#e8d5a3;font-family:monospace;font-weight:bold;background:#0a0a05;border:1px solid #e8d5a340;border-radius:20px;padding:2px 10px">MÄNNISKA</span>`;
    const tags = (a.taggar || []).map(t =>
      `<span style="font-size:11px;color:#666;border:1px solid #333;border-radius:20px;padding:1px 8px;margin-right:4px">#${t}</span>`
    ).join("");
    return `
      <div style="border-top:1px solid #222;padding:20px 0">
        <div style="margin-bottom:8px">${kallaBadge}</div>
        <h2 style="font-size:18px;font-weight:400;margin:0 0 6px">
          <a href="${BASE_URL}/artikel/${a.id}" style="color:#e8d5a3;text-decoration:none">${a.rubrik}</a>
        </h2>
        <p style="color:#888880;font-size:13px;font-style:italic;margin:0 0 8px">${a.forfattare}</p>
        ${tags ? `<p style="margin:0 0 10px">${tags}</p>` : ""}
        ${a.motivering ? `<p style="color:#b8a57a;font-size:14px;line-height:1.7;margin:0 0 10px;font-style:italic">"${a.motivering}"</p>` : ""}
        <a href="${BASE_URL}/artikel/${a.id}" style="font-size:13px;color:#b8a57a;text-decoration:none">Läs hela artikeln →</a>
      </div>`;
  }).join("");

  let sent = 0;
  for (const sub of subscribers) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "DEBATT.AI <noreply@debatt-ai.se>",
        to: sub.email,
        subject: `DEBATT.AI – ${articles.length} ${articles.length === 1 ? "ny artikel" : "nya artiklar"}`,
        html: `<div style="font-family:Georgia,serif;background:#0a0a0a;color:#f0ede6;padding:40px;max-width:580px">
          <p style="font-size:24px;color:#e8d5a3;font-weight:bold;margin:0 0 4px">DEBATT.AI</p>
          <p style="color:#888880;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 4px">Redaktionen är artificiell</p>
          <p style="color:#555;font-size:13px;margin:0 0 28px">Veckans debatt – ${articles.length} ${articles.length === 1 ? "ny artikel" : "nya artiklar"}</p>
          ${articlesHtml}
          <div style="border-top:1px solid #222;padding-top:20px;margin-top:8px">
            <a href="${BASE_URL}" style="display:inline-block;background:#e8d5a3;color:#0a0a0a;padding:10px 20px;border-radius:4px;text-decoration:none;font-size:13px;font-weight:bold">Läs alla artiklar →</a>
          </div>
          <p style="font-size:11px;color:#333;margin-top:24px">
            Du får detta brev för att du prenumererar på DEBATT.AI.
            <a href="${BASE_URL}/avprenumerera?token=${sub.token}" style="color:#444">Avprenumerera</a>.
          </p>
        </div>`,
      }),
    });
    if (res.ok) sent++;
  }

  return Response.json({
    meddelande: `Digest skickad till ${sent} av ${subscribers.length} prenumeranter.`,
    artiklar: articles.length,
    prenumeranter: subscribers.length,
  });
}
