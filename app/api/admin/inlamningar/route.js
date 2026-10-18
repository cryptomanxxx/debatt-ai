import {
  hamtaInlamning, listaInlamningar, sattStatus, raderaInlamning,
  publiceraInlamning, rubrikFinns, serviceKey,
} from "../../../lib/inlamningDb";

// Adminpanelens inlämningsflik. Tidigare läste, ändrade och raderade panelen
// `inlamningar` direkt med den publika anon-nyckeln — lösenordet kontrollerades
// bara i webbläsaren. Nu kontrolleras lösenordet här och databasen nås med
// service role.
const SECRET = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
const SIDA = 50;
const STATUSAR = new Set(["inkorg", "publicerad", "avvisad"]);

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Ogiltig JSON" }, { status: 400 }); }
  if (!SECRET || !body?.pw || body.pw !== SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const key = serviceKey();
  if (!key) return Response.json({ error: "Service role-nyckel saknas" }, { status: 503 });

  const id = Number(body.id);
  const harId = Number.isInteger(id) && id > 0;

  try {
    switch (body.action) {
      case "lista": {
        const offset = Math.max(0, parseInt(body.offset, 10) || 0);
        return Response.json(await listaInlamningar(key, offset, SIDA));
      }
      case "status": {
        if (!harId || !STATUSAR.has(body.status)) return Response.json({ error: "Ogiltig förfrågan" }, { status: 400 });
        const antal = await sattStatus(key, id, body.status);
        if (antal === 0) return Response.json({ error: "Inlämningen finns inte" }, { status: 404 });
        return Response.json({ ok: true });
      }
      case "radera": {
        if (!harId) return Response.json({ error: "Ogiltigt id" }, { status: 400 });
        const antal = await raderaInlamning(key, id);
        if (antal === 0) return Response.json({ error: "Inlämningen finns inte" }, { status: 404 });
        return Response.json({ ok: true });
      }
      case "publicera": {
        if (!harId) return Response.json({ error: "Ogiltigt id" }, { status: 400 });
        const inl = await hamtaInlamning(key, id);
        if (!inl) return Response.json({ error: "Inlämningen finns inte" }, { status: 404 });
        if (await rubrikFinns(key, inl.rubrik)) {
          return Response.json({ error: "Artikeln finns redan publicerad i arkivet." }, { status: 409 });
        }
        const utfall = await publiceraInlamning(key, inl);
        return Response.json({ ok: true, artikel_id: utfall.artikelId });
      }
      default:
        return Response.json({ error: "Okänd åtgärd" }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
