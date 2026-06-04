import { NextResponse } from "next/server";

const REPO = "cryptomanxxx/debatt-ai";
const GH   = "https://api.github.com";

const ADMIN_PW = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export async function GET(req) {
  const pw = req.headers.get("x-admin-password") || new URL(req.url).searchParams.get("pw");
  if (ADMIN_PW && pw !== ADMIN_PW) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: "GITHUB_TOKEN saknas" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const per_page = Math.min(parseInt(searchParams.get("per_page") || "60"), 100);

  try {
    const [runsRes, workflowsRes] = await Promise.all([
      fetch(`${GH}/repos/${REPO}/actions/runs?per_page=${per_page}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
        next: { revalidate: 60 },
      }),
      fetch(`${GH}/repos/${REPO}/actions/workflows`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
        next: { revalidate: 300 },
      }),
    ]);

    if (!runsRes.ok) return NextResponse.json({ error: `GitHub API: ${runsRes.status}` }, { status: 502 });

    const [{ workflow_runs }, { workflows }] = await Promise.all([runsRes.json(), workflowsRes.json()]);

    const wfMap = Object.fromEntries((workflows || []).map(w => [w.id, w.name]));

    const runs = (workflow_runs || []).map(r => ({
      id:           r.id,
      workflow_id:  r.workflow_id,
      workflow:     wfMap[r.workflow_id] || r.name,
      status:       r.status,       // queued | in_progress | completed
      conclusion:   r.conclusion,   // success | failure | cancelled | skipped | null
      event:        r.event,        // schedule | workflow_dispatch | push
      created_at:   r.created_at,
      updated_at:   r.updated_at,
      run_started_at: r.run_started_at,
      html_url:     r.html_url,
      run_number:   r.run_number,
      head_branch:  r.head_branch,
    }));

    return NextResponse.json({ runs, total: workflow_runs?.length ?? 0 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
