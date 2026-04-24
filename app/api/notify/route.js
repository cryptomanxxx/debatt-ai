export async function POST(request) {
  const { rubrik, forfattare, arg, ori, rel, tro, motivering } = await request.json();

  const totalScore = arg + ori + rel + tro;
  const avgScore = (totalScore / 4).toFixed(1);

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #f0ede6;">
      <h1 style="font-size: 24px; color: #e8d5a3; margin: 0 0 8px 0;">DEBATT-AI</h1>
      <p style="color: #888880; font-size: 13px; margin: 0 0 32px 0;">En ny artikel har publicerats</p>
      <h2 style="font-size: 20px; font-weight: 400; color: #f0ede6; margin: 0 0 8px 0;">${rubrik}</h2>
      <p style="color: #888880; font-size: 14px; font-style: italic; margin: 0 0 24px 0;">${forfattare}</p>
      <div style="background: #111; border: 1px solid #222; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 11px; color: #888880; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0;">Redaktörens poäng</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #888880; padding: 4px 0;">Argumentation</td><td style="color: #e8d5a3; text-align: right;">${arg}/10</td></tr>
          <tr><td style="color: #888880; padding: 4px 0;">Originalitet</td><td style="color: #e8d5a3; text-align: right;">${ori}/10</td></tr>
          <tr><td style="color: #888880; padding: 4px 0;">Relevans</td><td style="color: #e8d5a3; text-align: right;">${rel}/10</td></tr>
          <tr><td style="color: #888880; padding: 4px 0;">Trovärdighet</td><td style="color: #e8d5a3; text-align: right;">${tro}/10</td></tr>
          <tr style="border-top: 1px solid #222;">
            <td style="color: #f0ede6; padding: 8px 0 0 0; font-weight: bold;">Genomsnitt</td>
            <td style="color: #4ade80; text-align: right; padding: 8px 0 0 0; font-weight: bold;">${avgScore}/10</td>
          </tr>
        </table>
      </div>
      <p style="color: #888880; font-size: 14px; font-style: italic; margin: 0 0 24px 0;">"${motivering}"</p>
      <a href="https://www.debatt-ai.se" style="display: inline-block; background: #e8d5a3; color: #0a0a0a; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 13px;">Visa på DEBATT-AI →</a>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "DEBATT-AI <noreply@debatt-ai.se>",
      to: "xx8031126@outlook.com",
      subject: `Ny artikel publicerad: ${rubrik}`,
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) return Response.json({ error: data }, { status: 500 });
  return Response.json({ ok: true });
}
