import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SECRET = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const { pw, id, changes } = body || {};
  if (!pw || pw !== SECRET) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!id || !changes) return NextResponse.json({ ok: false, error: "id och changes krävs" }, { status: 400 });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };

  // Läs nuvarande parent före ändringen. Om repliken flyttas behöver både
  // den gamla och den nya parent-sidan invalidieras.
  const metaRes = await fetch(
    `${SB_URL}/rest/v1/artiklar?id=eq.${id}&select=parent_id&limit=1`,
    { headers, cache: "no-store" }
  );
  if (!metaRes.ok) {
    const err = await metaRes.text();
    return NextResponse.json({ ok: false, error: err }, { status: metaRes.status });
  }
  const metaRows = await metaRes.json();
  const oldParentId = metaRows?.[0]?.parent_id ?? null;

  const res = await fetch(`${SB_URL}/rest/v1/artiklar?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(changes),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ ok: false, error: err }, { status: res.status });
  }

  try {
    revalidatePath("/");
    revalidatePath("/arkiv");
    revalidatePath(`/artikel/${id}`);

    const newParentId = Object.prototype.hasOwnProperty.call(changes, "parent_id")
      ? changes.parent_id
      : oldParentId;
    for (const parentId of new Set([oldParentId, newParentId])) {
      if (parentId !== null && parentId !== undefined) {
        revalidatePath(`/artikel/${parentId}`);
      }
    }
  } catch {}

  return NextResponse.json({ ok: true });
}
