import { readdir, readFile } from "fs/promises";
import path from "path";

const REPORTS_DIR = path.join(process.cwd(), "ai-bus/reports");

export async function GET() {
  try {
    const files = (await readdir(REPORTS_DIR))
      .filter(f => f.endsWith(".json"))
      .sort()
      .reverse()
      .slice(0, 12); // senaste 12 veckorna

    const reports = await Promise.all(
      files.map(async f => {
        try {
          const raw = await readFile(path.join(REPORTS_DIR, f), "utf8");
          return JSON.parse(raw);
        } catch { return null; }
      })
    );

    return Response.json(
      reports.filter(Boolean),
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json([], { headers: { "Cache-Control": "no-store" } });
  }
}
