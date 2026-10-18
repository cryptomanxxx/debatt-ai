// Server-only Supabase-anrop för `inlamningar`. Allt går med service role-
// nyckeln: anon-nyckeln är publik (syns i klientens JS) och ska varken kunna
// läsa opublicerade inlämningar eller skriva till `artiklar`.
import { revalidatePath } from "next/cache";
import { artikelradFranInlamning } from "./inlamning.mjs";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function headers(key, extra = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extra };
}

async function felText(res) {
  try { return (await res.text()).slice(0, 300); } catch { return `HTTP ${res.status}`; }
}

export async function sparaInlamning(key, rad) {
  const res = await fetch(`${SB_URL}/rest/v1/inlamningar`, {
    method: "POST",
    headers: headers(key, { Prefer: "return=representation" }),
    body: JSON.stringify(rad),
  });
  if (!res.ok) throw new Error(await felText(res));
  const data = await res.json();
  const id = data?.[0]?.id;
  if (!id) throw new Error("Inlämningen sparades utan id");
  return id;
}

export async function hamtaInlamning(key, id) {
  const res = await fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${id}&select=*&limit=1`, {
    headers: headers(key),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await felText(res));
  return (await res.json())?.[0] || null;
}

export async function listaInlamningar(key, offset, limit) {
  const res = await fetch(
    `${SB_URL}/rest/v1/inlamningar?select=*&order=skapad.desc&limit=${limit}&offset=${offset}`,
    { headers: headers(key, { Prefer: "count=exact" }), cache: "no-store" }
  );
  if (!res.ok) throw new Error(await felText(res));
  const total = parseInt(res.headers.get("content-range")?.split("/")[1] ?? "0", 10);
  return { rows: await res.json(), total };
}

export async function sattStatus(key, id, status) {
  const res = await fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${id}`, {
    method: "PATCH",
    headers: headers(key, { Prefer: "return=representation" }),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await felText(res));
  return ((await res.json()) || []).length;
}

export async function raderaInlamning(key, id) {
  const res = await fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${id}`, {
    method: "DELETE",
    headers: headers(key, { Prefer: "return=representation" }),
  });
  if (!res.ok) throw new Error(await felText(res));
  return ((await res.json()) || []).length;
}

/**
 * Publicerar en sparad inlämning. Statusen byts villkorat (bara från
 * `fran`-status) INNAN artikeln skapas, så två samtidiga anrop aldrig kan
 * publicera samma inlämning två gånger. Misslyckas artikeln återställs statusen.
 * Returnerar { artikelId } eller { konflikt: true }.
 */
export async function publiceraInlamning(key, inl, { rubrik, franStatus } = {}) {
  const villkor = franStatus ? `&status=eq.${encodeURIComponent(franStatus)}` : "";
  const lasRes = await fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${inl.id}${villkor}`, {
    method: "PATCH",
    headers: headers(key, { Prefer: "return=representation" }),
    body: JSON.stringify({ status: "publicerad" }),
  });
  if (!lasRes.ok) throw new Error(await felText(lasRes));
  if (((await lasRes.json()) || []).length === 0) return { konflikt: true };

  const artRes = await fetch(`${SB_URL}/rest/v1/artiklar`, {
    method: "POST",
    headers: headers(key, { Prefer: "return=representation" }),
    body: JSON.stringify(artikelradFranInlamning(inl, rubrik)),
  });
  if (!artRes.ok) {
    const fel = await felText(artRes);
    await fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${inl.id}`, {
      method: "PATCH",
      headers: headers(key),
      body: JSON.stringify({ status: inl.status }),
    }).catch(() => {});
    throw new Error(fel);
  }
  const artikelId = (await artRes.json())?.[0]?.id ?? null;
  try {
    revalidatePath("/");
    revalidatePath("/arkiv");
  } catch {}
  return { artikelId };
}

export async function rubrikFinns(key, rubrik) {
  const res = await fetch(
    `${SB_URL}/rest/v1/artiklar?rubrik=eq.${encodeURIComponent(rubrik)}&select=id&limit=1`,
    { headers: headers(key), cache: "no-store" }
  );
  if (!res.ok) throw new Error(await felText(res));
  return ((await res.json()) || []).length > 0;
}
