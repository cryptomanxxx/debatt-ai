#!/usr/bin/env node
/**
 * Codestral PR review — körs av GitHub Actions vid varje ny PR.
 * Hämtar diffen via GitHub API, skickar till Codestral och postar
 * resultatet som en PR-kommentar.
 *
 * Env-variabler som krävs:
 *   MISTRAL_API_KEY     — Mistral API-nyckel (redan i GitHub Secrets)
 *   GITHUB_TOKEN        — automatisk i GitHub Actions
 *   GITHUB_REPOSITORY   — "owner/repo", automatisk
 *   PR_NUMBER           — PR-numret
 *   HEAD_SHA            — commit-hash på PR-branchen
 */

const https = require("https");

const MISTRAL_KEY  = process.env.MISTRAL_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO         = process.env.GITHUB_REPOSITORY;
const PR_NUMBER    = process.env.PR_NUMBER;
const HEAD_SHA     = process.env.HEAD_SHA || "";

// Filändelser som ska granskas (skippa bilder, lockfiler, etc.)
const GRANSKA_REGEX = /\.(py|js|ts|jsx|tsx|sql|json|yml|yaml)$/;

// Max diff-storlek att skicka till Codestral (~28 k tecken ≈ ~7 k tokens)
const MAX_DIFF_CHARS = 28_000;

// ── Hjälpfunktion: HTTP-anrop med JSON ───────────────────────────────────────
function httpJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed   = new URL(url);
    const reqOpts  = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   options.method || "GET",
      headers:  { "Content-Type": "application/json", ...options.headers },
    };
    const req = https.request(reqOpts, (res) => {
      let body = "";
      res.on("data",  (c) => body += c);
      res.on("end",   ()  => {
        try   { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { reject(new Error(`JSON-parse fel (${res.statusCode}): ${body.slice(0, 300)}`)); }
      });
    });
    req.on("error", reject);
    if (options.body) req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

// ── Hämta PR-diff via GitHub API ─────────────────────────────────────────────
async function hamtaDiff() {
  const [owner, repo] = REPO.split("/");
  const { status, data } = await httpJson(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${PR_NUMBER}/files`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "User-Agent":  "codestral-pr-review/1.0",
        Accept:        "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (status !== 200) throw new Error(`GitHub API: ${status} — ${JSON.stringify(data).slice(0, 200)}`);
  if (!Array.isArray(data)) throw new Error(`Oväntat svar från GitHub: ${JSON.stringify(data).slice(0, 200)}`);

  let diff       = "";
  let antalFiler = 0;

  for (const fil of data) {
    if (!fil.patch)                           continue;
    if (!GRANSKA_REGEX.test(fil.filename))    continue;

    const block = `### ${fil.filename}\n\`\`\`diff\n${fil.patch}\n\`\`\`\n\n`;
    if (diff.length + block.length > MAX_DIFF_CHARS) {
      diff += `\n*(diff trunkerad — ${data.length - antalFiler} filer kvar)*\n`;
      break;
    }
    diff += block;
    antalFiler++;
  }

  return { diff, antalFiler };
}

// ── Skicka diff till Codestral ────────────────────────────────────────────────
async function granskaMedCodestral(diff) {
  const prompt = `Du är en erfaren kodgranskare. Granska denna pull request-diff och identifiera enbart genuina buggar, säkerhetsproblem eller allvarliga beteendeproblem.

Regler:
- Flagga BARA verkliga problem — inte stilpreferenser eller kosmetiska förbättringar
- Ett fynd per problem, kortfattat
- Om inga problem hittas: skriv en kort positiv bekräftelse
- Fokus på: logikfel, saknad felhantering vid systembränder (API/DB), säkerhetsproblem, dataförlust-risker
- Svara på svenska

Diff att granska:

${diff}`;

  const { status, data } = await httpJson(
    "https://api.mistral.ai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MISTRAL_KEY}`,
        "User-Agent":  "codestral-pr-review/1.0",
      },
      body: {
        model:       "codestral-latest",
        messages:    [{ role: "user", content: prompt }],
        max_tokens:  1200,
        temperature: 0.1,
      },
    }
  );

  if (status !== 200) throw new Error(`Codestral API: ${status} — ${JSON.stringify(data).slice(0, 300)}`);
  return data.choices?.[0]?.message?.content?.trim() || null;
}

// ── Posta kommentar på PR ─────────────────────────────────────────────────────
async function postaKommentar(text) {
  const [owner, repo] = REPO.split("/");
  const kommentar = [
    "## 🔍 Codestral Code Review",
    "",
    text,
    "",
    "---",
    `*Granskat av [Codestral](https://mistral.ai/news/codestral/) · \`${HEAD_SHA.slice(0, 7)}\`*`,
  ].join("\n");

  const { status, data } = await httpJson(
    `https://api.github.com/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "User-Agent":  "codestral-pr-review/1.0",
        Accept:        "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: { body: kommentar },
    }
  );

  if (status !== 201) throw new Error(`Kunde inte posta kommentar: ${status} — ${JSON.stringify(data).slice(0, 200)}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!MISTRAL_KEY)  { console.log("MISTRAL_API_KEY saknas — hoppar över granskning"); process.exit(0); }
  if (!GITHUB_TOKEN) { console.log("GITHUB_TOKEN saknas — hoppar över granskning"); process.exit(0); }
  if (!PR_NUMBER)    { console.log("PR_NUMBER saknas"); process.exit(1); }

  console.log(`🔍 Granskar PR #${PR_NUMBER} i ${REPO}…`);

  const { diff, antalFiler } = await hamtaDiff();

  if (!diff.trim()) {
    console.log("Inga kodändringar att granska (bara bilder/lockfiler/etc.)");
    process.exit(0);
  }

  console.log(`Diff: ${antalFiler} filer, ${diff.length} tecken`);

  const granskning = await granskaMedCodestral(diff);
  if (!granskning) {
    console.log("Codestral returnerade inget svar");
    process.exit(0);
  }

  await postaKommentar(granskning);
  console.log("✓ Granskning postad");
}

main().catch((err) => {
  console.error("FEL:", err.message);
  process.exit(1);
});
