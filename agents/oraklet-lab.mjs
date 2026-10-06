import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { runExperiment, parseProposal } from './oraklet-lab-core.mjs';

const URL = 'https://debatt-ai-orchestrator.xx8031126.workers.dev/v1/query';
const SB = 'https://fmwxftnistkoqazfwnuj.supabase.co';
const key = process.env.ORCHESTRATOR_API_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (key.length < 24 || !serviceKey) throw new Error('ORCHESTRATOR_API_KEY och SUPABASE_SERVICE_ROLE_KEY krävs');

async function readJson(response, max = 32768) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Tomt serversvar');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) { await reader.cancel(); throw new Error('För stort serversvar'); }
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { throw new Error('Serversvaret kunde inte läsas som begränsad JSON'); }
  finally { reader.releaseLock(); }
}

// Check persistence before spending model calls. Never fall back to anon writes.
const probe = await fetch(`${SB}/rest/v1/oraklet_experiment?select=id&limit=0`, {
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  redirect: 'error', signal: AbortSignal.timeout(10000),
});
await probe.body?.cancel();
if (!probe.ok) throw new Error('Labbet saknar databasåtkomst. Kör supabase_oraklet_experiment.sql först.');

const { getDynamicChain, callWithFallback } = await import('../app/lib/aiRouter.js');
const chain = await getDynamicChain('chatt');
const propose = messages => callWithFallback(chain, messages, {
  maxTokens: 800, temperature: 0, json: true, source: 'oraklet-lab',
  validate: text => !!parseProposal(text),
});
async function callTool(input) {
  const response = await fetch(URL, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`,
      'User-Agent': 'Debatt-AI-BootLoops-Smoke/1.0 (GitHub Actions)' },
    body: JSON.stringify({ tool: 'bootloops_ratfit', input }),
  });
  return { status: response.status, data: await readJson(response) };
}

await mkdir('reports/oraklet-lab', { recursive: true });
const seed = process.env.EXPERIMENT_SEED || '20261006';
const report = await runExperiment(seed, propose, callTool, commitments => {
  // Also log fingerprints before model calls; fixtures are disclosed afterwards.
  console.log('Datans SHA-256 före modellförslagen:', JSON.stringify(commitments));
});
report.createdAt = new Date().toISOString();
report.codeCommit = /^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA || '') ? process.env.GITHUB_SHA : null;
report.runUrl = /^\d+$/.test(process.env.GITHUB_RUN_ID || '')
  ? `https://github.com/cryptomanxxx/debatt-ai/actions/runs/${process.env.GITHUB_RUN_ID}` : null;
const markdown = `# ${report.title}\n\nForskare: Professor Oraklet\n\n${report.question}\n\n${report.method}\n\n` +
  `| Fall | Första förslag | Korrigeringsförsök | Slutligt förslag | Samma modell | Ratfit | Felaktiga data avvisade |\n| --- | --- | --- | --- | --- | --- | --- |\n` +
  report.cases.map(c => `| ${c.case} | ${c.initialPassed ? 'Godkänt' : 'Underkänt'} | ${c.correctionAttempted ? 'Ja' : 'Behövdes inte'} | ${c.passed ? 'Godkänt' : 'Underkänt'} | ${c.sameModel ? 'Ja' : 'Nej'} | Godkänt | Ja |`).join('\n') +
  `\n\n${report.limitations}\n\nSeed: ${report.seed}. Data, förslag, modellnamn och facit finns i report.json.\n`;
await writeFile('reports/oraklet-lab/report.json', JSON.stringify(report, null, 2) + '\n');
await writeFile('reports/oraklet-lab/report.md', markdown);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);

const response = await fetch(`${SB}/rest/v1/oraklet_experiment`, {
  method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
  body: JSON.stringify({ id: randomUUID(), titel: report.title, status: report.status,
    rapport: report, skapad: report.createdAt }),
});
await response.body?.cancel();
if (!response.ok) throw new Error('Rapporten kunde inte sparas i Supabase. Rapportfilerna finns i workflow-artefakten.');
console.log('Rapport sparad. Godkända modellförslag:', report.cases.filter(c => c.passed).length, 'av 3.');
