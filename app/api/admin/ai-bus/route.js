import { NextResponse } from "next/server";

const REPO = "cryptomanxxx/debatt-ai";
const GH   = "https://api.github.com";

const FOLDERS = [
  { id: "suggestions",  label: "Förslag",       path: "ai-bus/suggestions" },
  { id: "approved",     label: "Godkänt",        path: "ai-bus/approved" },
  { id: "implemented",  label: "Implementerat",  path: "ai-bus/implemented" },
  { id: "rejected",     label: "Avvisat",        path: "ai-bus/rejected" },
  { id: "discussions",  label: "Diskussioner",   path: "ai-bus/discussions", recursive: true },
  { id: "reports",      label: "Rapporter",      path: "ai-bus/reports" },
];

const NEW_THRESHOLD_HOURS = 48;

function ghHeaders(token) {
  const h = { Accept: "application/vnd.github.v3+json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function parseFrontmatter(content) {
  const fm = {};
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return fm;
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) fm[key] = val;
  }
  return fm;
}

function stripFrontmatter(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
}

function isNew(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d)) return false;
  return (Date.now() - d.getTime()) < NEW_THRESHOLD_HOURS * 3600 * 1000;
}

async function readFile(token, filePath) {
  const r = await fetch(`${GH}/repos/${REPO}/contents/${filePath}`, {
    headers: ghHeaders(token),
    next: { revalidate: 120 },
  });
  if (!r.ok) return null;
  const data = await r.json();
  if (!data.content) return null;
  return Buffer.from(data.content, "base64").toString("utf-8");
}

async function listFolder(token, folderPath, recursive = false) {
  const r = await fetch(`${GH}/repos/${REPO}/contents/${folderPath}`, {
    headers: ghHeaders(token),
    next: { revalidate: 120 },
  });
  if (!r.ok) return [];
  const items = await r.json();
  if (!Array.isArray(items)) return [];
  const files = items.filter(f => f.type === "file" && (f.name.endsWith(".md") || f.name.endsWith(".json")));
  if (recursive) {
    const dirs = items.filter(f => f.type === "dir");
    const sub = await Promise.all(dirs.map(d => listFolder(token, d.path, true)));
    return [...files, ...sub.flat()].sort((a, b) => b.name.localeCompare(a.name));
  }
  return files.sort((a, b) => b.name.localeCompare(a.name));
}

const ALLOWED_PREFIXES = FOLDERS.map(f => f.path + "/");

function checkAuth(req) {
  const secret = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  if (!secret) return true; // no password configured → open dev environment
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const { searchParams } = new URL(req.url);
  const qs = searchParams.get("secret");
  return bearer === secret || qs === secret;
}

function isAllowedPath(filePath) {
  if (filePath.includes("..")) return false;
  const normalized = filePath.replace(/\\/g, "/");
  return ALLOWED_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

export async function GET(req) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder");
  const file   = searchParams.get("file");

  if (file) {
    if (!isAllowedPath(file)) {
      return NextResponse.json({ error: "Otillåten sökväg" }, { status: 403 });
    }
    const content = await readFile(token, file);
    if (!content) return NextResponse.json({ error: "Kunde inte läsa filen" }, { status: 404 });
    const fm = parseFrontmatter(content);
    const body = stripFrontmatter(content);
    return NextResponse.json({ fm, body, raw: content });
  }

  if (folder) {
    const target = FOLDERS.find(f => f.id === folder);
    if (!target) return NextResponse.json({ error: "Okänd mapp" }, { status: 400 });
    const files = await listFolder(token, target.path, target.recursive);
    const result = files.map(f => {
      const dateMatch = f.name.match(/^(\d{4}-\d{2}-\d{2})/);
      const fileDate  = dateMatch ? dateMatch[1] : null;
      return {
        name:    f.name,
        path:    f.path,
        sha:     f.sha,
        size:    f.size,
        html_url: f.html_url,
        fileDate,
        isNew:   isNew(fileDate ? fileDate + "T00:00:00Z" : null),
      };
    });
    return NextResponse.json({ files: result, folder: target.label });
  }

  // Return metadata for all folders (file counts + newest date)
  const results = await Promise.allSettled(
    FOLDERS.map(async f => {
      const files = await listFolder(token, f.path, f.recursive);
      const newCount = files.filter(file => {
        const m = file.name.match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? isNew(m[1] + "T00:00:00Z") : false;
      }).length;
      return { ...f, count: files.length, newCount, newest: files[0]?.name ?? null };
    })
  );

  const folders = results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { ...FOLDERS[i], count: 0, newCount: 0, newest: null }
  );

  return NextResponse.json({ folders });
}
